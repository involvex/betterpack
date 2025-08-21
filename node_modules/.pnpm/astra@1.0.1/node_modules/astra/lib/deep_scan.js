var typeOf = require('type-of-is').string;
var deepCompare = require('./deep_compare');

module.exports = deepScan = function (pattern, obj, deep) {
    if (!~['Object', 'Array'].indexOf(typeOf(pattern)))throw Error('Pattern and object must be array or object');

    var subPatterns = [],
        highPattern = {};

    for (var i in pattern) {
        if (i === '**') {
            if (typeOf(pattern[i]) === 'Object') {
                subPatterns.push(pattern[i]);
            } else if (typeOf(pattern[i]) === 'Array') {
                subPatterns = subPatterns.concat(pattern[i]);
            }
        } else {
            highPattern[i] = pattern[i];
        }
    }

    var results = [];

    if (deepCompare(highPattern, obj)) {
        if (subPatterns.length === 0) {
            if (!deep) {
                return [obj];
            } else {
                results.push(obj);
            }
        } else {
            deep = false;
        }
    } else if (!deep) {
        return [];
    }

    for (var i in obj) {
        if (~['Object', 'Array'].indexOf(typeOf(obj[i]))) {
            if (deep) {
                var subResults = deepScan(pattern, obj[i], true);
                if (typeOf(subResults) === 'Array') {
                    results = results.concat(subResults);
                }
            }else {
                subPatterns.forEach(function (pattern) {
                    var subResults = deepScan(pattern, obj[i], true);
                    if (typeOf(subResults) === 'Array' && subResults.length > 0) {
                        results = results.concat(subResults);
                    }
                });
            }
        }
    }

    return results.length > 0 ? results : [];
}

