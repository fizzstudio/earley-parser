//   Copyright 2015 Yurii Lahodiuk (yura.lagodiuk@gmail.com)
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

/** @public */
export class Grammar {
  private lhsToRhsList: {[lhs: string]: string[][]};

  constructor(rules: string[]) {
    this.lhsToRhsList = {};
    for (const rule of rules) {
      // "A -> B C | D" -> ["A ", " B C | D"]
      const parts = rule.split('->');
      // "A"
      const lhs = parts[0].trim();
      // "B C | D"
      const rhss = parts[1].trim();
      // "B C | D" -> ["B C", "D"]
      const rhssParts = rhss.split('|');
      if (!this.lhsToRhsList[lhs]) {
        this.lhsToRhsList[lhs] = [];
      }
      for (const rhssPart of rhssParts) {
        this.lhsToRhsList[lhs].push(rhssPart.trim().split(' '));
      }
      // now this.lhsToRhsList contains list of these rules:
      // {... "A": [["B", "C"], ["D"]] ...}
    }
  }

  terminalSymbols(token: string): string[] {
    return [];
  }

  getRightHandSides(leftHandSide: string) {
    const rhss = this.lhsToRhsList[leftHandSide];
    if (rhss) {
      return rhss;
    }
    return null;
  }

  isEpsilonProduction(term: string) {
    // This is needed for handling of epsilon (empty) productions
    // TODO: get rid of this hardcode name for epsilon productions
    return "_EPSILON_" === term;
  }
}

//------------------------------------------------------------------------------------

let loggingOn = true;
/** @public */
export function logging(allow: boolean) {
  loggingOn = allow;
}

/** @public */
export class Chart {
  private currentId = 0;
  private idToState: {[id: number]: State} = {};
  private chart: State[][];

  constructor(tokens: string[]) {
    this.chart = [];
    for (let i = 0; i < tokens.length + 1; i++) {
      this.chart[i] = [];
    }
  }

  addToChart(newState: State, position: number) {
    newState.setId(this.currentId);
    // TODO: use HashSet + LinkedList
    const chartColumn = this.chart[position];
    for (const chartState of chartColumn) {
      if (newState.equals(chartState)) {
        let changed = false; // This is needed for handling of epsilon (empty) productions

        changed = chartState.appendRefsToChidStates(newState.getRefsToChidStates());
        return changed;
      }
    }
    chartColumn.push(newState);
    this.idToState[this.currentId] = newState;
    this.currentId++;

    const changed = true; // This is needed for handling of epsilon (empty) productions
    return changed;
  }

  getStatesInColumn(index: number) {
    return this.chart[index];
  }

  countStatesInColumn(index: number) {
    return this.chart[index].length;
  }

  getState(id: number) {
    return this.idToState[id];
  }

  getFinishedRoot(rootRule: string) {
    const lastColumn = this.chart[this.chart.length - 1];
    for (var i in lastColumn) {
      const state = lastColumn[i];
      if (state.complete() && state.getLeftHandSide() === rootRule) {
        // TODO: there might be more than one root rule in the end
        // so, there is needed to return an array with all these roots
        return state;
      }
    }
    return null;
  }

  log(column: number) {
    if (loggingOn) {
      console.log('-------------------')
      console.log('Column: ' + column)
      console.log('-------------------')
      for (const state of this.chart[column]) {
        console.log(state.toString())
      }
    }
  }
}

//------------------------------------------------------------------------------------

// Generating array of all possible combinations, e.g.:
// input: [[1, 2, 3], [4, 5]]
// output: [[1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5]]
//
// Empty subarrays will be ignored. E.g.:
// input: [[1, 2, 3], []]
// output: [[1], [2], [3]]
function combinations(arrOfArr: ParseTree[][], i: number, stack: ParseTree[], result: ParseTree[][]) {
  if (i === arrOfArr.length) {
    result.push(stack.slice());
    return;
  }
  if (arrOfArr[i].length === 0) {
    combinations(arrOfArr, i + 1, stack, result);
  } else {
    for (let j in arrOfArr[i]) {
      if (stack.length === 0 || stack[stack.length - 1].right === arrOfArr[i][j].left) {
        stack.push(arrOfArr[i][j]);
        combinations(arrOfArr, i + 1, stack, result);
        stack.pop();
      }
    }
  }
}

/** @public */
export interface ParseTree {
  root: string | string[];
  left: number;
  right: number;
  subtrees?: ParseTree[];
}

/** @public */
export class State {
  private id: number;
  private ref: {[j: number]: State}[];

  constructor(private lhs: string, private rhs: string[], 
    private dot: number, private left: number, private right: number) {
    this.id = -1;
    this.ref = [];
    for (let i = 0; i < rhs.length; i++) {
      this.ref[i] = {};
    }
  }

  complete() {
    return this.dot >= this.rhs.length;
  }

  toString() {
    const builder = [];
    builder.push('(id: ' + this.id + ')');
    builder.push(this.lhs);
    builder.push('→');
    for (let i = 0; i < this.rhs.length; i++) {
      if (i === this.dot) {
        builder.push('•');
      }
      builder.push(this.rhs[i]);
    }
    if (this.complete()) {
      builder.push('•');
    }
    builder.push('[' + this.left + ', ' + this.right + ']');
    builder.push(JSON.stringify(this.ref))
    return builder.join(' ');
  }

  expectedNonTerminal(grammar: Grammar) {
    const expected = this.rhs[this.dot];
    const rhss = grammar.getRightHandSides(expected);
    if (rhss !== null) {
      return true;
    }
    return false;
  }

  setId(id: number) {
    this.id = id;
  }

  getId() {
    return this.id;
  }

  equals(otherState: State) {
    if (this.lhs === otherState.lhs && this.dot === otherState.dot && 
      this.left === otherState.left && this.right === otherState.right && 
      JSON.stringify(this.rhs) === JSON.stringify(otherState.rhs)) {
      return true;
    }
    return false;
  }

  getRefsToChidStates() {
    return this.ref;
  }

  appendRefsToChidStates(refs: typeof this.ref) {
    let changed = false; // This is needed for handling of epsilon (empty) productions

    for (let i = 0; i < refs.length; i++) {
      if (refs[i]) {
        for (let j in refs[i]) {
          if (this.ref[i][j] !== refs[i][j]) {
            changed = true;
          }
          this.ref[i][j] = refs[i][j];
        }
      }
    }
    return changed;
  }

  predictor(grammar: Grammar, chart: Chart) {
    const  nonTerm = this.rhs[this.dot];
    const rhss = grammar.getRightHandSides(nonTerm);
    let changed = false; // This is needed for handling of epsilon (empty) productions
    for (const rhs of rhss!) {
      // This is needed for handling of epsilon (empty) productions
      // Just skipping over epsilon productions in right hand side
      // However, this approach might lead to the smaller amount of parsing tree variants
      let dotPos = 0;
      while (rhs && (dotPos < rhs.length) && (grammar.isEpsilonProduction(rhs[dotPos]))) {
        dotPos++;
      }

      const newState = new State(nonTerm, rhs, dotPos, this.right, this.right);
      changed ||= chart.addToChart(newState, this.right);
    }
    return changed;
  }

  scanner(grammar: Grammar, chart: Chart, token: string) {
    const term = this.rhs[this.dot];

    let changed = false; // This is needed for handling of epsilon (empty) productions

    let tokenTerminals = token ? grammar.terminalSymbols(token) : [];
    if (!tokenTerminals) {
      // in case if grammar.terminalSymbols(token) returned 'undefined' or null
      tokenTerminals = [];
    }
    tokenTerminals.push(token);
    for (const i in tokenTerminals) {
      if (term === tokenTerminals[i]) {
        const newState = new State(term, [token], 1, this.right, this.right + 1);
        changed ||= chart.addToChart(newState, this.right + 1);
        break;
      }
    }

    return changed;
  }

  completer(grammar: Grammar, chart: Chart) {

    let changed = false; // This is needed for handling of epsilon (empty) productions

    const statesInColumn = chart.getStatesInColumn(this.left);
    for (const existingState of statesInColumn) {
      if (existingState.rhs[existingState.dot] === this.lhs) {

        // This is needed for handling of epsilon (empty) productions
        // Just skipping over epsilon productions in right hand side
        // However, this approach might lead to the smaller amount of parsing tree variants
        let dotPos = existingState.dot + 1;
        while (existingState.rhs && (dotPos < existingState.rhs.length) && (grammar.isEpsilonProduction(existingState.rhs[dotPos]))) {
          dotPos++;
        }

        const newState = new State(existingState.lhs, existingState.rhs, dotPos, existingState.left, this.right);
        // copy existing refs to new state
        newState.appendRefsToChidStates(existingState.ref);
        // add ref to current state
        const rf = new Array(existingState.rhs.length);
        rf[existingState.dot] = {};
        rf[existingState.dot][this.id] = this;
        newState.appendRefsToChidStates(rf)
        changed ||= chart.addToChart(newState, this.right);
      }
    }

    return changed;
  }

  // Returning all possible correct parse trees
  // Possible exponential complexity and memory consumption!
  // Take care of your grammar!
  // TODO: instead of returning all possible parse trees - provide iterator + callback
  traverse() {
    if (this.ref.length === 1 && Object.keys(this.ref[0]).length === 0) {
      // This is last production in parse tree (leaf)
      const subtrees: ParseTree[] = [];
      // XXX not sure what's going on here
      //if (this.lhs !== this.rhs) {
        // prettify leafs of parse tree
        subtrees.push({
          root: this.rhs,
          left: this.left,
          right: this.right
        });
      //}
      return [{
        root: this.lhs,
        left: this.left,
        right: this.right,
        subtrees
      }];
    }
    const rhsSubTrees: ParseTree[][] = [];
    for (let i = 0; i < this.ref.length; i++) {
      rhsSubTrees[i] = [];
      for (let j in this.ref[i]) {
        rhsSubTrees[i] = rhsSubTrees[i].concat(this.ref[i][j].traverse());
      }
    }
    const possibleSubTrees: ParseTree[][] = [];
    combinations(rhsSubTrees, 0, [], possibleSubTrees);
    const result = [];
    for (var i in possibleSubTrees) {
      result.push({
        root: this.lhs,
        left: this.left,
        right: this.right,
        subtrees: possibleSubTrees[i]
      })
    }
    return result;
  }

  getLeftHandSide() {
    return this.lhs;
  }
}

//------------------------------------------------------------------------------------

/** @public */
export function parse(tokens: string[], grammar: Grammar, rootRule: string) {
  const chart = new Chart(tokens);
  const rootRuleRhss = grammar.getRightHandSides(rootRule);
  for (const rhs of rootRuleRhss!) {
    const initialState = new State(rootRule, rhs, 0, 0, 0);
    chart.addToChart(initialState, 0);
  }
  for (var i = 0; i < tokens.length + 1; i++) {

    let changed = true; // This is needed for handling of epsilon (empty) productions

    while (changed) {
      changed = false;
      let j = 0;
      while (j < chart.countStatesInColumn(i)) {
        var state = chart.getStatesInColumn(i)[j];
        if (!state.complete()) {
          if (state.expectedNonTerminal(grammar)) {
            changed ||= state.predictor(grammar, chart);
          } else {
            changed ||= state.scanner(grammar, chart, tokens[i]);
          }
        } else {
          changed ||= state.completer(grammar, chart);
        }
        j++;
      }
    }
    chart.log(i)
  }
  return chart;
}
