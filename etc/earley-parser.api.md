## API Report File for "@fizz/earley-parser"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public (undocumented)
export class Chart {
    constructor(tokens: string[]);
    // (undocumented)
    addToChart(newState: State, position: number): boolean;
    // (undocumented)
    countStatesInColumn(index: number): number;
    // (undocumented)
    getFinishedRoot(rootRule: string): State | null;
    // (undocumented)
    getState(id: number): State;
    // (undocumented)
    getStatesInColumn(index: number): State[];
    // (undocumented)
    log(column: number): void;
}

// @public (undocumented)
export class Grammar {
    constructor(rules: string[]);
    // (undocumented)
    getRightHandSides(leftHandSide: string): string[][] | null;
    // (undocumented)
    isEpsilonProduction(term: string): boolean;
    // (undocumented)
    terminalSymbols(token: string): string[];
}

// @public (undocumented)
export function logging(allow: boolean): void;

// @public (undocumented)
export function parse(tokens: string[], grammar: Grammar, rootRule: string): Chart;

// @public (undocumented)
export interface ParseTree {
    // (undocumented)
    left: number;
    // (undocumented)
    right: number;
    // (undocumented)
    root: string | string[];
    // (undocumented)
    subtrees?: ParseTree[];
}

// @public (undocumented)
export class State {
    constructor(lhs: string, rhs: string[], dot: number, left: number, right: number);
    // (undocumented)
    appendRefsToChidStates(refs: typeof State.ref): boolean;
    // (undocumented)
    complete(): boolean;
    // (undocumented)
    completer(grammar: Grammar, chart: Chart): boolean;
    // (undocumented)
    equals(otherState: State): boolean;
    // (undocumented)
    expectedNonTerminal(grammar: Grammar): boolean;
    // (undocumented)
    getId(): number;
    // (undocumented)
    getLeftHandSide(): string;
    // (undocumented)
    getRefsToChidStates(): {
        [j: number]: State;
    }[];
    // (undocumented)
    predictor(grammar: Grammar, chart: Chart): boolean;
    // (undocumented)
    scanner(grammar: Grammar, chart: Chart, token: string): boolean;
    // (undocumented)
    setId(id: number): void;
    // (undocumented)
    toString(): string;
    // (undocumented)
    traverse(): {
        root: string;
        left: number;
        right: number;
        subtrees: ParseTree[];
    }[];
}

// (No @packageDocumentation comment for this package)

```
