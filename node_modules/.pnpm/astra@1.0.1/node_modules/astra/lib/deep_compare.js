var typeOf = require('type-of-is').string;

module.exports = deepCompare = function (pattern, obj, deep) {
    if (!~['Object', 'Array'].indexOf(typeOf(pattern)) || !~['Object', 'Array'].indexOf(typeOf(pattern)))throw Error('Pattern and object must be array or object');

    var _deep = false,
        not = false;
    for (var i in pattern) {
        if (i === '*') {
            _deep = true;
            continue;
        }

        if (!obj.hasOwnProperty(i) || typeOf(pattern[i]) !== typeOf(obj[i])) {
            not = true;
        } else if (~['Object', 'Array'].indexOf(typeOf(pattern[i]))) {
            if (deepCompare(pattern[i], obj[i], deep)) {
                continue;
            } else {
                not = true;
            }
        } else if (pattern[i] !== obj[i]) {
            not = true;
        }

        if (not && !deep) {
            return false;
        }
    }

    if (_deep) {
        return deepCompare(pattern['*'], obj, true);
    }

    if (!not) {
        return true;
    }

    if (deep) {
        for (var i in obj) {
            if (obj.hasOwnProperty(i) && ~['Object', 'Array'].indexOf(typeOf(obj[i]))) {
                if (deepCompare(pattern, obj[i], true)) {
                    return true;
                }
            }
        }
    }

    return false;
}

