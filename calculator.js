let assert = require('assert');

function format_str(str){
    let new_str = str.replace(/\s/g, '');
    if(/^-/.test(new_str)){
        new_str = '0' + new_str;
    }
    // new_str = new_str.replace(/\-/g, '+-');
    return new_str;
}
function test_format_str(){
    assert.equal(format_str(" 1  - 1"), '1-1');
    assert.equal(format_str("-1"), '0-1');
}
test_format_str();

/* METHOD: build_ast(root, str)
 * DESCRIPTION:
 *   Parses a string into a binary structure representing an abstract syntax tree.
 *   1) match operators in order of precedence
 *   2) if it finds one, create a node in the AST, recurse left & right
 *   3) if it doesn't, move onto the next operator until exhausted
 */
function build_ast(root, str){
    // match operators in order
    let ops = [
        {name: 'plus', RE: /\+/g},
        {name: 'minus', RE: /\-/g},
        {name: 'mult', RE: /\*/g},
        {name: 'div', RE: /\//g},
        {name: 'value', RE: /-?\d+/g},
    ];
    for(let i=0; i<ops.length; i++){
        let op = ops[i];

        // Get the last match so that we put the left-most terms at the leaves of the tree
        //   thus evaluating the expression from left to right when we unwind the tree
        let result=null, match=null;
        do{
            result = match;
            match = op.RE.exec(str);
        }while(match);

        // if it finds one, create a node in the AST, recurse left & right
        if(result){
            let op_pos = result.index,
                lhs = str.slice(0, op_pos),
                rhs = str.slice(op_pos+1);
            root.op = op;
            root.sym = result[0];
            // Assumes every operator but 'value' has lhs and rhs values
            if(op.name != 'value'){
                root.lhs = {};
                root.rhs = {};
                build_ast(root.lhs, lhs);
                build_ast(root.rhs, rhs);
            }
            break;
        }else{
            // if it doesn't, move onto the next operator until exhausted
            continue;
        }
    }
}

function eval_ast(root){
    let {op, lhs, rhs, sym} = root;
    switch(op.name){
    case 'value':
        let val = parseInt(sym, 10);
        return val;
        break;
    case 'plus':
        return eval_ast(lhs) + eval_ast(rhs);
        break;
    case 'mult':
        return eval_ast(lhs) * eval_ast(rhs);
        break;
    case 'div':
        return eval_ast(lhs) / eval_ast(rhs);
        break;
    case 'minus':
        return eval_ast(lhs) - eval_ast(rhs);
        break;
    }
}

function evaluate(str){
    let ast = {},
        result;
    str=format_str(str);
    build_ast(ast, str);
    result = eval_ast(ast);
    return result;
}

function tests(){
    let tests = [
        // Test + and -
        { input: "1+2+3-2-1", output: 3},
        { input: "1-1+1-1+1-1", output: 0},
        { input: "1-1+1-1+1-1+1", output: 1},
        { input: "12-6", output: 6},
        { input: "555", output: 555},
        { input: "5-1", output: 4},
        { input: "5-1-1", output: 3},
        { input: "-555", output: -555},
        { input: "-555-100-10-1", output: -666},
        // Test mult
        { input: "5*5", output: 25 },
        { input: "3+5*5", output: 28 },
        // Test div
        { input: "3+5/5", output: 4 },
        // Test fractions
        { input: "3/5 + 1", output: 1.6 },
        // Test parens
        // { input: "(1+3/(2*2))*5", output: 8.75 }
        {input: "5-1-1+(3*7)/14/8", output: 3.1875}
    ];
    tests.forEach((test)=>{
        console.log("evaluating:", test.input);
        let actual = evaluate(test.input),
            expected = test.output;
        assert.equal(actual, expected);
        console.log("  passed with: ", expected, "==", actual);
    });
}

tests();
// console.log(evaluate("1+2+3"));
// console.log(evaluate("1+2+3-2"));
// console.log(evaluate("1+2+3-2-1"));

// let test_ast = {};
// build_ast(test_ast, "5-1-1");
// console.log(test_ast);

