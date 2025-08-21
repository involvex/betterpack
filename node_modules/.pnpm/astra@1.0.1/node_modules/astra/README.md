ASTRA
=========

ASTRA is easy to use AST traverse library

Installation
------------

```sh
npm install --save astra
```

Usage
------

```javascript

var astra=require('astra');

var newAst=astra(ast)
    .when(pattern,function(chunk){

    })
    .when(anotherPattern,function(chunk){

    })
    .run();

```

Examples
------
simple
```javascript
var newAst = astra(ast)
    .when({
        "type": "Literal",
        "value": "myDirective",
        "raw": "\"myDirective\""
    }, function (chunk) {
        chunk.value = "newMyDirective";
        chunk.raw = "\"newMyDirective\""
    })
    .run();
```
<br>
async handler
```javascript
astra(ast, true)
    .when({
        "type": "Literal",
        "value": "myDirective",
        "raw": "\"myDirective\""
    }, function (chunk, done) {
        chunk.value = "newMyDirective";
        chunk.raw = "\"newMyDirective\""
        setTimeout(done, 1000);
    })
    .run(function (err, newAst) {
                    ...
    });
```
<br>
array pattern (equivalent OR)
```javascript
var newAst = astra(ast)
    .when([
        {
            "type": "Literal",
            "value": "/app/templates/template.html"

        },
        {
            "type": "Literal",
            "value": "/app/styles/styles.css"
        }
    ], function (chunk) {
        chunk.value = "";
        chunk.raw = "\"\"";
    })
    .run();
```
<br>
complex pattern(** means deep child)
```javascript
var newAst=astra(ast)
    .when({
        "type": "FunctionExpression",
        "params": [
            {
                "type": "Identifier",
                "name": "$routeProvider"
            }
        ],
        "**": {
            "type": "CallExpression",
            "callee": {
                "type": "MemberExpression",
                "property": {
                    "type": "Identifier",
                    "name": "when"
                }
            },
            "**": [
                {
                    "type": "Property",
                    "key": {
                        "type": "Identifier",
                        "name": "template"
                    },
                    "value": {
                        "type": "Literal"
                    }
                },
                {
                    "type": "Property",
                    "key": {
                        "type": "Identifier",
                        "name": "styles"
                    },
                    "value": {
                        "type": "Literal"
                    }
                }
            ]
        }
    }, function (chunk) {
        chunk.value.value='';
    })
    .run();
```

License
----

MIT

