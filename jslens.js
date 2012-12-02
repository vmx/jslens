// Lenses can have different types:
//  - string: A string lens takes a string/regular expression as argument
//  - combinator: A combinator lens takes another lens as input
//
// I made this differentiation to make the processing easier. If it is a
// combinator lens, the input gets just passed on to the sub lenses. If it
// is a string lens, it gets processed.

var NO_CI_MATCH = 0x1;
var NO_AO_MATCH = 0x2;

if (typeof exports === 'undefined') exports = window;

var CopyLens = exports.CopyLens = function(match) {
    //if (typeof match === 'string') {
    //    match = new RegExp(match);
    //}
    this.match = match;
};
CopyLens.prototype.get = function(concreteInput) {
    var re = new RegExp('^' + this.match.toString().slice(1,-1));
    var split = re.exec(concreteInput);
    // The lens didn't match
    if (split === null) {
        return {noMatch: NO_CI_MATCH};
    }

    return {result: split[0], ci: concreteInput.substr(split[0].length)};
};
CopyLens.prototype.put = function(abstractOutput, concreteInput) {
    var re = new RegExp('^' + this.match.toString().slice(1,-1));
    //return processSplit(abstractOutput, re, concreteInput, re);
    var res = processSplit(abstractOutput, re, concreteInput, re);
    if (res.splitAo !== undefined) {
        res.result = res.splitAo;
    }
    return res;
};
CopyLens.prototype.create = function(abstractOutput) {
    var re = new RegExp('^' + this.match.toString().slice(1,-1));
    var split = re.exec(abstractOutput);

    // The lens didn't match
    if (split === null) {
        return {noMatch: NO_AO_MATCH};
    }

    return {
        result: split[0],
        ao: abstractOutput.substr(split[0].length)
    };
};


var processSplit = function(abstractOutput, reAo, concreteInput, reCi) {
    var splitAo = reAo.exec(abstractOutput);
    var splitCi = reCi.exec(concreteInput);

    var res = {
        noMatch: 0
    };
    if (splitAo === null) {
        res.noMatch |= NO_AO_MATCH;
    }
    else {
        res.ao = abstractOutput.substr(splitAo[0].length);
        //res.result = splitAo[0];
        res.splitAo = splitAo[0];
    }
    if (splitCi === null) {
        res.noMatch |= NO_CI_MATCH;
    }
    else {
        res.ci = concreteInput.substr(splitCi[0].length);
        res.splitCi = splitCi[0];
    }
    if (res.noMatch === 0) {
        delete res.noMatch;
    }
    return res;
};

// We implement the default lens instead of the const lens.
// The `createFun` is a function that will be called in the create, it has
// one argument which is the abstractOutput. If a string instead of a function
// is supplied, it is a shortcut for `function() {return thestring;}`
var DefaultLens = exports.DefaultLens = function(match, out, createFun) {
    this.match = match;
    this.out = out;
    if (typeof createFun === 'string') {
        this.createFun = function() {return createFun;};
    }
    else {
        this.createFun = createFun;
    }
};
DefaultLens.prototype.get = function(concreteInput) {
    var re = new RegExp('^' + this.match.toString().slice(1,-1));
    var split = re.exec(concreteInput);
    // The lens didn't match
    if (split === null) {
        return {noMatch: NO_CI_MATCH};
    }

    return {
        result: this.out,
        ci: concreteInput.substr(split[0].length)
    };
};
DefaultLens.prototype.put = function(abstractOutput, concreteInput) {
    // `this.out` is always just a string
    var out = this.out;
    if (out[0] === '(' || out[0] === ')') {
        out = '\\' + out;
    }
    var reAo = new RegExp('^' + out);
    var reCi = new RegExp('^' + this.match.toString().slice(1,-1));

    var res = processSplit(abstractOutput, reAo, concreteInput, reCi);
    if (res.splitCi !== undefined) {
        res.result = res.splitCi;
    }
    return res;
};
DefaultLens.prototype.create = function(abstractOutput) {
    var out = this.out;
    if (out[0] === '(' || out[0] === ')') {
        out = '\\' + out;
    }
    var re = new RegExp('^' + out);
    var split = re.exec(abstractOutput);

    // The lens didn't match
    if(split === null) {
        return {noMatch: NO_AO_MATCH};
    }

    if (this.createFun === undefined) {
        throw("You need to define a `createFun`");
    }

    return {
        result: this.createFun(abstractOutput),
        ao: abstractOutput.substr(split[0].length)
    };
};

// DelLens takes as second parameter either a function or a string.
// The string is a shortcut for `function() {return thestring;}`
var DelLens = exports.DelLens = function(match, createFun) {
    this.match = match;
    this.out = '';
    if (typeof createFun === 'string') {
        this.createFun = function() {return createFun;};
    }
    else {
        this.createFun = createFun;
    }
};
DelLens.prototype.get = DefaultLens.prototype.get;
DelLens.prototype.put = DefaultLens.prototype.put;
DelLens.prototype.create = DefaultLens.prototype.create;

InsLens = function(out) {
    this.match = new RegExp('');
    this.out = out;

    this.createFun = function() {return '';};
};
InsLens.prototype.get = DefaultLens.prototype.get;
InsLens.prototype.put = DefaultLens.prototype.put;
InsLens.prototype.create = DefaultLens.prototype.create;


// Combinators
var ConcatLens = exports.ConcatLens = function(lenses) {
    this.lenses = lenses;
};
ConcatLens.prototype.get = function(concreteInput) {
    return this.lenses.reduce(function(acc, lens, index, list) {
        // XXX vmx 2012-07-23: Is there a better way to "break" the reduce
        //    somehow?
        if (acc === false) {
            return false;
        }

        var res = lens.get(acc.ci);
        if ('noMatch' in res) {
            return res;
        }

        return {
            result: acc.result + res.result,
            ci: res.ci
        };
    }, {result: '', ci: concreteInput});
};

ConcatLens.prototype.put = function(abstractOutput, concreteInput) {
    return this.lenses.reduce(function(acc, lens, index, list) {
        // XXX vmx 2012-07-23: Is there a better way to "break" the reduce
        //    somehow?
        if (acc === false) {
            return false;
        }

        var res = lens.put(acc.ao, acc.ci);
        if ('noMatch' in res) {
            return res;
        }

        return {
            result: acc.result + res.result,
            ao: res.ao,
            ci: res.ci
        };
    }, {result: '', ao: abstractOutput, ci: concreteInput});
};

ConcatLens.prototype.create = function(abstractOutput) {
    return this.lenses.reduce(function(acc, lens, index, list) {
        // XXX vmx 2012-07-23: Is there a better way to "break" the reduce
        //    somehow?
        if (acc === false) {
            return false;
        }

        var res = lens.create(acc.ao);
        if ('noMatch' in res) {
            return res;
        }

        return {
            result: acc.result + res.result,
            ao: res.ao
        };
    }, {result: '', ao: abstractOutput});
};

var KleeneLens = exports.KleeneLens = function(lens) {
    this.lens = lens;
};
KleeneLens.prototype.get = function(concreteInput) {
    var result = '';
    while(true) {
        var res = this.lens.get(concreteInput);
        if ('noMatch' in res) {
            break;
        }
        result += res.result;
        concreteInput = res.ci;
    }

    return {
        result: result,
        ci: concreteInput
    };
};
KleeneLens.prototype.put = function(abstractOutput, concreteInput) {
    var result = '';
    while(true) {
        var res = this.lens.put(abstractOutput, concreteInput);
        if ('noMatch' in res) {

            if ((res.noMatch & NO_AO_MATCH) && (res.noMatch & NO_CI_MATCH)) {
                // neither ao nor ci match, hence leave the loop
                break;
            }
            else {
                // There's still some concrete input, but no corresponding
                // abstract output
                if (res.noMatch & NO_AO_MATCH) {
                    delete res.result;
                }
                // There's still some abstract output, but not corresponding
                // concrete input
                if (res.noMatch & NO_CI_MATCH) {
                    res = this.lens.create(abstractOutput);
                }
            }
        }
        if (res.result !== undefined) {
            result += res.result;
        }
        if (res.ao !== undefined) {
            abstractOutput = res.ao;
        }
        if (res.ci !== undefined) {
            concreteInput = res.ci;
        }
    }

    return {
        result: result,
        ao: abstractOutput,
        ci: concreteInput
    };
};
KleeneLens.prototype.create = function(abstractOutput) {
    var result = '';
    while(true) {
        var res = this.lens.create(abstractOutput);
        if ('noMatch' in res) {
            break;
        }
        result += res.result;
        abstractOutput = res.ao;
    }

    return {
        result: result,
        ao: abstractOutput
    };
};

var UnionLens = exports.UnionLens = function(lenses) {
    this.lenses = lenses;
};
UnionLens.prototype.get = function(concreteInput) {
    var res = {
        noMatch: NO_CI_MATCH,
        ci: concreteInput
    };

    for (var i in this.lenses) {
        var lensRes = this.lenses[i].get(concreteInput);
        // Use first matching lens
        if (!('noMatch' in lensRes)) {
            return lensRes;
        }
    }

    return res;
};

// The put is implemented differently from the original dissertation. The
// checks whether the source (concrete input) matched is dome right after the
// view (abstract output) matched (as opposed to do it only when several
// views matched).
UnionLens.prototype.put = function(abstractOutput, concreteInput) {
    var res = {
        // Return no match at all even if one might have matched (but of
        // course it is removed if both matched)
        noMatch: NO_CI_MATCH | NO_AO_MATCH,
        ao: abstractOutput,
        ci: concreteInput
    };

    for (var i in this.lenses) {
        var lensRes = this.lenses[i].put(abstractOutput, concreteInput);
        // The lens matched the abstract output and the concrete input
        if (!('noMatch' in lensRes)) {
            return lensRes;
        }
        // XXX vmx 20120-09-15: Not sure if we should return immediately
        //     here, or if we should collect the result and wait for a
        //     possible lens that matches both, the abstract output and
        //     the concrete input
        // The lens matched only the abstract output, hence use the
        // create of that lens
        // NOTE vmx 2012-09-15: Not sure if this is how it is described
        //     in the original paper
        else if (!(lensRes.noMatch & NO_AO_MATCH) &&
                 (lensRes.noMatch & NO_CI_MATCH)) {
            lensRes = this.lenses[i].create(abstractOutput);
            // The `create` doesn't return a concrete input, hence add one
            lensRes.ci = '';
            return lensRes;
        }
    }

    return res;
};

UnionLens.prototype.create = function(abstractOutput) {
    var res = {
        noMatch: NO_AO_MATCH,
        ao: abstractOutput
    };

    for (var i in this.lenses) {
        var lensRes = this.lenses[i].create(abstractOutput);
        // The lens matched the abstract output and the concrete input
        if (!('noMatch' in lensRes)) {
            return lensRes;
        }
    }

    return res;
};
