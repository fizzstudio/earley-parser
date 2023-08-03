
import { Grammar, parse, type ParseTree } from "../../lib/main";
import '@fizz/ui-components/stylesheet';
import './style.css';

export function getContent() {
   
    // Example from: https://en.wikipedia.org/wiki/CYK_algorithm#Example
    const grammar = new Grammar([
        'S -> NP VP',
        'VP -> VP PP | V NP | V',
        'PP -> P NP',
        'NP -> Det N | N | NP PP'
    ]);

    grammar.terminalSymbols = function(token) {
        if (token === 'eats') return ['V'];
        if (token === 'fish') return ['N'];
        if (token === 'fork') return ['N'];
        if (token === 'she') return ['N'];
        if (token === 'a') return ['Det'];
        if (token === 'with') return ['P'];
        // otherwise:
        return [];
    }

    // S - sentence
    // V - verb
    // N - noun
    // P - preposition
    // Det - determiner
    // NP - noun phrase
    // VP - verb phrase
    // PP - preposition phrase

    // You have to tokenize input by yourself!
    // Creating array of tokens
    const tokens = 'she eats a fish with a fork'.split(' ');

    // Parsing
    const rootRule = 'S';
    const chart = parse(tokens, grammar, rootRule);

    console.log('\n');

    // Get array with all parse trees
    const trees =  chart.getFinishedRoot(rootRule)!.traverse();

    let content = '';
    // Iterate over all parse trees and display them
    for (const tree of trees) {
        console.log(JSON.stringify(tree));
        content += '<div class="tree" id="displayTree"><ul>' + displayTree(tree) + '</ul></div></br>';
    }

    function displayTree(tree: ParseTree): string {
        if (!tree.subtrees || tree.subtrees.length === 0) {
            return '<li><a href="#">' + tree.root + '</a></li>';
        }
        var builder = [];
        builder.push('<li><a href="#">');
        builder.push(tree.root);
        builder.push('</a>')
        builder.push('<ul>')
        for (var i in tree.subtrees) {
            builder.push(displayTree(tree.subtrees[i]))
        }
        builder.push('</ul>')
        builder.push('</li>')
        return builder.join('');
    }
    return content;
}
