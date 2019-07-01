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

function evaluate_flat_expression(str){
    let ast = {},
        result;
    str=format_str(str);
    build_ast(ast, str);
    result = eval_ast(ast);
    return result;
}

function tests(options={}){
    let tests = [
        // Test + and -
        { input: "1+2+3-2-1", output: 3},
        { input: "1-1+1-1+1-1", output: 0},
        { input: "1-1+1-1+1-1+1", output: 1},
        { input: "12-6", output: 6},
        { input: "555", output: 555},
        { input: "5-1", output: 4},
        { input: "5-1-1", output: 3},
        { input: "5-0+6", output: 11},
        { input: "-555", output: -555},
        { input: "-555-100-10-1", output: -666},
        // Test mult
        { input: "5*5", output: 25 },
        { input: "3+5*5", output: 28 },
        // Test div
        { input: "3+5/5", output: 4 },
        // Test fractions
        { input: "3/5 + 1", output: 1.6 },
        // General test
        {input: "5-1-1+(3*7)/14/8", output: 3.1875},
        // Test parens
        {input: "(5-(1-1)+(3*2))", output: 11},
    ];
    tests.forEach((test)=>{
        if(!options.quiet){
          console.log("evaluating:", test.input);
        }
        let actual = evaluate(test.input),
            expected = test.output;
        assert.equal(actual, expected);
        if(!options.quiet){
            console.log("  passed with: ", expected, "==", actual);
        }
    });
}

let str = '((()()))';
function matching_parens(str, open_paren_pos){
    let balance = 0;
    if(str[open_paren_pos] == '('){
        balance += 1;
    }else{
        return -1;
    }
    for(let i=open_paren_pos+1; i<str.length; i++){
        let char = str[i];
        if (char == '('){
            balance += 1;
        }else if(char == ')'){
            balance -= 1;
        }
        if (balance==0){
            return i;
        }
    }
    return -1;
}
function test_matching_parens(){
    let tests = [
        { input: ['()', 0], output: 1},
        { input: ['()', 1], output: -1},
        { input: ['()()', 2], output: 3},
        { input: ['(())', 0], output: 3},
        { input: ['(())', 1], output: 2},
        { input: ['((())', 0], output: -1},
    ];
    tests.forEach((test)=>{
        assert.equal(matching_parens(...test.input), test.output);
    });
}

test_matching_parens();
tests({quiet: true});

function recurse_on_parens(str){
    let open_paren_match = /\(/.exec(str);
    if(open_paren_match){
        let open_paren_pos = open_paren_match.index,
            close_paren_pos = matching_parens(str, open_paren_pos),
            substr = str.slice(open_paren_pos, close_paren_pos+1),
            inside_parens_substr = substr.slice(1, substr.length-1);
        // evaluate the sub-exp & splice the result into the outer expression
        let result = recurse_on_parens(inside_parens_substr);
        return str.slice(0, open_paren_pos) + result + str.slice(close_paren_pos+1);
    }else{
        return evaluate_flat_expression(str);
    }
}

function evaluate(expression){
    while(expression.indexOf('(') != -1){
        expression = recurse_on_parens(expression);
    }
    expression = recurse_on_parens(expression);
    return expression;
}

function accept_user_input(){
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  console.log("Please type in your formula and press enter:")
  process.stdin.on('data', function (chunk) {
    console.log(evaluate(chunk));
    console.log("\nPlease type in your formula and press enter:")
  });
}
accept_user_input();
