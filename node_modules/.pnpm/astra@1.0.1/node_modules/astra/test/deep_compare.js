var should = require('should');

var deepCompare = require('../lib/deep_compare');

describe('Deep compare', function () {
    it('Monkey tests', function () {
        try {
            deepCompare(1, {});
        } catch (e) {
            e.message.should.be.equal('Pattern and object must be array or object');
        }
        try {
            deepCompare(null, []);
        } catch (e) {
            e.message.should.be.equal('Pattern and object must be array or object');
        }

        try {
            deepCompare({}, undefined);
        } catch (e) {
            e.message.should.be.equal('Pattern and object must be array or object');
        }

        try {
            deepCompare([], 'test');
        } catch (e) {
            e.message.should.be.equal('Pattern and object must be array or object');
        }

    });

    it('Should return equal', function () {
        var pattern = {"type": "Program", "body": [
            {
                "type": "ExpressionStatement",
                "expression": {
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "computed": false,
                                "object": {
                                    "type": "CallExpression",
                                    "callee": {
                                        "type": "MemberExpression",
                                        "computed": false,
                                        "object": {
                                            "type": "Identifier",
                                            "name": "angular"
                                        },
                                        "property": {
                                            "type": "Identifier",
                                            "name": "module"
                                        }
                                    },
                                    "arguments": [
                                        {
                                            "type": "Literal",
                                            "value": "App.directives",
                                            "raw": "\"App.directives\""
                                        }
                                    ]
                                },
                                "property": {
                                    "type": "Identifier",
                                    "name": "directive"
                                }
                            },
                            "arguments": [
                                {
                                    "type": "Literal",
                                    "value": "myDirective",
                                    "raw": "\"myDirective\""
                                },
                                {
                                    "type": "FunctionExpression",
                                    "id": null,
                                    "params": [],
                                    "defaults": [],
                                    "body": {
                                        "type": "BlockStatement",
                                        "body": [
                                            {
                                                "type": "ReturnStatement",
                                                "argument": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "template"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/templates/template.html",
                                                                "raw": "\"/app/templates/template.html\""
                                                            },
                                                            "kind": "init"
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "styles"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/styles/styles.css",
                                                                "raw": "\"/app/styles/styles.css\""
                                                            },
                                                            "kind": "init"
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    "rest": null,
                                    "generator": false,
                                    "expression": false
                                }
                            ]
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "directive"
                        }
                    },
                    "arguments": [
                        {
                            "type": "Literal",
                            "value": "myDirective",
                            "raw": "\"myDirective\""
                        },
                        {
                            "type": "ArrayExpression",
                            "elements": [
                                {
                                    "type": "Literal",
                                    "value": "$scope",
                                    "raw": "'$scope'"
                                },
                                {
                                    "type": "FunctionExpression",
                                    "id": null,
                                    "params": [
                                        {
                                            "type": "Identifier",
                                            "name": "$scope"
                                        }
                                    ],
                                    "defaults": [],
                                    "body": {
                                        "type": "BlockStatement",
                                        "body": [
                                            {
                                                "type": "ReturnStatement",
                                                "argument": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "template"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/templates/template.html",
                                                                "raw": "\"/app/templates/template.html\""
                                                            },
                                                            "kind": "init"
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "styles"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/styles/styles.css",
                                                                "raw": "\"/app/styles/styles.css\""
                                                            },
                                                            "kind": "init"
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    "rest": null,
                                    "generator": false,
                                    "expression": false
                                }
                            ]
                        }
                    ]
                }
            }
        ]};
        var object = {"type": "Program", "body": [
            {
                "type": "ExpressionStatement",
                "expression": {
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "computed": false,
                                "object": {
                                    "type": "CallExpression",
                                    "callee": {
                                        "type": "MemberExpression",
                                        "computed": false,
                                        "object": {
                                            "type": "Identifier",
                                            "name": "angular"
                                        },
                                        "property": {
                                            "type": "Identifier",
                                            "name": "module"
                                        }
                                    },
                                    "arguments": [
                                        {
                                            "type": "Literal",
                                            "value": "App.directives",
                                            "raw": "\"App.directives\""
                                        }
                                    ]
                                },
                                "property": {
                                    "type": "Identifier",
                                    "name": "directive"
                                }
                            },
                            "arguments": [
                                {
                                    "type": "Literal",
                                    "value": "myDirective",
                                    "raw": "\"myDirective\""
                                },
                                {
                                    "type": "FunctionExpression",
                                    "id": null,
                                    "params": [],
                                    "defaults": [],
                                    "body": {
                                        "type": "BlockStatement",
                                        "body": [
                                            {
                                                "type": "ReturnStatement",
                                                "argument": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "template"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/templates/template.html",
                                                                "raw": "\"/app/templates/template.html\""
                                                            },
                                                            "kind": "init"
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "styles"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/styles/styles.css",
                                                                "raw": "\"/app/styles/styles.css\""
                                                            },
                                                            "kind": "init"
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    "rest": null,
                                    "generator": false,
                                    "expression": false
                                }
                            ]
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "directive"
                        }
                    },
                    "arguments": [
                        {
                            "type": "Literal",
                            "value": "myDirective",
                            "raw": "\"myDirective\""
                        },
                        {
                            "type": "ArrayExpression",
                            "elements": [
                                {
                                    "type": "Literal",
                                    "value": "$scope",
                                    "raw": "'$scope'"
                                },
                                {
                                    "type": "FunctionExpression",
                                    "id": null,
                                    "params": [
                                        {
                                            "type": "Identifier",
                                            "name": "$scope"
                                        }
                                    ],
                                    "defaults": [],
                                    "body": {
                                        "type": "BlockStatement",
                                        "body": [
                                            {
                                                "type": "ReturnStatement",
                                                "argument": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "template"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/templates/template.html",
                                                                "raw": "\"/app/templates/template.html\""
                                                            },
                                                            "kind": "init"
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "styles"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/styles/styles.css",
                                                                "raw": "\"/app/styles/styles.css\""
                                                            },
                                                            "kind": "init"
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    "rest": null,
                                    "generator": false,
                                    "expression": false
                                }
                            ]
                        }
                    ]
                }
            }
        ]};

        deepCompare(pattern, object).should.be.equal(true);

    });

    it('Should return equal 2', function () {
        var pattern = {"type": "Program", "body": [
            {
                "type": "ExpressionStatement"
            }
        ]};
        var object = {"type": "Program", "body": [
            {
                "type": "ExpressionStatement",
                "expression": {
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        "computed": false,
                        "object": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "computed": false,
                                "object": {
                                    "type": "CallExpression",
                                    "callee": {
                                        "type": "MemberExpression",
                                        "computed": false,
                                        "object": {
                                            "type": "Identifier",
                                            "name": "angular"
                                        },
                                        "property": {
                                            "type": "Identifier",
                                            "name": "module"
                                        }
                                    },
                                    "arguments": [
                                        {
                                            "type": "Literal",
                                            "value": "App.directives",
                                            "raw": "\"App.directives\""
                                        }
                                    ]
                                },
                                "property": {
                                    "type": "Identifier",
                                    "name": "directive"
                                }
                            },
                            "arguments": [
                                {
                                    "type": "Literal",
                                    "value": "myDirective",
                                    "raw": "\"myDirective\""
                                },
                                {
                                    "type": "FunctionExpression",
                                    "id": null,
                                    "params": [],
                                    "defaults": [],
                                    "body": {
                                        "type": "BlockStatement",
                                        "body": [
                                            {
                                                "type": "ReturnStatement",
                                                "argument": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "template"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/templates/template.html",
                                                                "raw": "\"/app/templates/template.html\""
                                                            },
                                                            "kind": "init"
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "styles"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/styles/styles.css",
                                                                "raw": "\"/app/styles/styles.css\""
                                                            },
                                                            "kind": "init"
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    "rest": null,
                                    "generator": false,
                                    "expression": false
                                }
                            ]
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "directive"
                        }
                    },
                    "arguments": [
                        {
                            "type": "Literal",
                            "value": "myDirective",
                            "raw": "\"myDirective\""
                        },
                        {
                            "type": "ArrayExpression",
                            "elements": [
                                {
                                    "type": "Literal",
                                    "value": "$scope",
                                    "raw": "'$scope'"
                                },
                                {
                                    "type": "FunctionExpression",
                                    "id": null,
                                    "params": [
                                        {
                                            "type": "Identifier",
                                            "name": "$scope"
                                        }
                                    ],
                                    "defaults": [],
                                    "body": {
                                        "type": "BlockStatement",
                                        "body": [
                                            {
                                                "type": "ReturnStatement",
                                                "argument": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "template"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/templates/template.html",
                                                                "raw": "\"/app/templates/template.html\""
                                                            },
                                                            "kind": "init"
                                                        },
                                                        {
                                                            "type": "Property",
                                                            "key": {
                                                                "type": "Identifier",
                                                                "name": "styles"
                                                            },
                                                            "value": {
                                                                "type": "Literal",
                                                                "value": "/app/styles/styles.css",
                                                                "raw": "\"/app/styles/styles.css\""
                                                            },
                                                            "kind": "init"
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    },
                                    "rest": null,
                                    "generator": false,
                                    "expression": false
                                }
                            ]
                        }
                    ]
                }
            }
        ]};

        deepCompare(pattern, object).should.be.equal(true);

    });

    it('Should return equal for deep pattern', function () {
        var pattern = {
            type: "ExpressionStatement",
            "*": {
                property: {
                    "type": "Identifier",
                    "name": "module"
                }
            }
        };
        var obj = {"type": "ExpressionStatement", "expression": {"type": "CallExpression", "callee": {"type": "MemberExpression", "computed": false, "object": {"type": "CallExpression", "callee": {"type": "MemberExpression", "computed": false, "object": {"type": "CallExpression", "callee": {"type": "MemberExpression", "computed": false, "object": {"type": "Identifier", "name": "angular"}, "property": {"type": "Identifier", "name": "module"}}, "arguments": [
            {"type": "Literal", "value": "Module1", "raw": "'Module1'"},
            {"type": "ArrayExpression", "elements": []}
        ]}, "property": {"type": "Identifier", "name": "service"}}, "arguments": [
            {"type": "Literal", "value": "one", "raw": "'one'"},
            {"type": "ArrayExpression", "elements": [
                {"type": "FunctionExpression", "id": null, "params": [], "defaults": [], "body": {"type": "BlockStatement", "body": []}, "rest": null, "generator": false, "expression": false}
            ]}
        ]}, "property": {"type": "Identifier", "name": "service"}}, "arguments": [
            {"type": "Literal", "value": "two", "raw": "'two'"},
            {"type": "FunctionExpression", "id": null, "params": [], "defaults": [], "body": {"type": "BlockStatement", "body": []}, "rest": null, "generator": false, "expression": false}
        ]}};

        deepCompare(pattern, obj).should.be.equal(true);
    });
});