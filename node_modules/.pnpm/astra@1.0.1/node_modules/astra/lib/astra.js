var deepScan = require('./deep_scan');
var typeOf = require('type-of-is').string;
var async = require('async');

module.exports = function (ast, isAsync) {
    var Ast = function (ast) {
        this.ast = ast;
        this.handlers = [];
        this.isAsync = 'undefined' == typeof isAsync ? false : isAsync;
    }

    Ast.prototype.when = function (pattern, handler) {
        if (!~['Array', 'Object'].indexOf(typeOf(pattern)))throw new Error('Pattern must be an Object or Array');
        if (typeOf(handler) !== 'Function')throw new Error('Handler must be a Function');

        this.handlers.push({
            pattern: pattern,
            handler: handler
        });

        return this;
    }

    Ast.prototype.traverse = function (ast, onNode) {
        if (!~['Object', 'Array'].indexOf(typeOf(ast)))throw new Error('Ast must be an object');
        if ('function' !== typeof onNode)throw new Error('second argument must be a function');

        if (typeOf(ast) === 'Object') {
            onNode(ast);
        }

        for (var i in ast) {
            if (~['Object', 'Array'].indexOf(typeOf(ast[i]))) {
                this.traverse(ast[i], onNode);
            }
        }
    }

    Ast.prototype.run = function (done) {
        var self = this;
        if (self.isAsync) {
            var handlers = [];
            if ('function' !== typeof done)throw Error('Astra was started in async mode, which require callback for run method');
            self.traverse(self.ast, function (node) {
                for (var ii in self.handlers) {
                    if (typeOf(self.handlers[ii].pattern) === 'Array') {
                        for (var iii in self.handlers[ii].pattern) {
                            deepScan(self.handlers[ii].pattern[iii], node).forEach(function (chunk) {
                                (function (ii, chunk) {
                                    handlers.push(function (done) {
                                        self.handlers[ii].handler(chunk, done);
                                    });
                                })(ii, chunk);
                            })
                        }
                    } else {
                        deepScan(self.handlers[ii].pattern, node).forEach(function (chunk) {
                            (function (ii, chunk) {
                                handlers.push(function (done) {
                                    self.handlers[ii].handler(chunk, done);
                                });
                            })(ii, chunk);
                        });
                    }
                }
            });
            if (handlers.length > 0) {
                async.parallel(handlers, function (err) {
                    done(err, self.ast);
                });
            } else {
                done(null, self.ast);
            }
        } else {
            self.traverse(self.ast,function(node){
                for (var ii in self.handlers) {
                    if (typeOf(self.handlers[ii].pattern) === 'Array') {
                        for (var iii in self.handlers[ii].pattern) {
                            deepScan(self.handlers[ii].pattern[iii], node).forEach(function (chunk) {
                                self.handlers[ii].handler(chunk);
                            });

                        }
                    } else {
                        deepScan(self.handlers[ii].pattern, node).forEach(function (chunk) {
                            self.handlers[ii].handler(chunk);
                        });
                    }
                }
            });

            return  this.ast;
        }
    }

    return new Ast(ast);

}