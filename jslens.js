// Lenses can have different types:
//  - string: A string lens takes a string/regular expression as argument
//  - combinator: A combinator lens takes another lens as input
//
// I made this differentiation to make the processing easier. If it is a
// combinator lens, the input gets just passed on to the sub lenses. If it
// is a string lens, it gets processed.

const NO_CI_MATCH = 0x1
const NO_AO_MATCH = 0x2

export class CopyLens {
  #match

  constructor(match) {
    this.#match = match
  }

  get(concreteInput) {
    const re = new RegExp('^' + this.#match.toString().slice(1,-1))
    const split = re.exec(concreteInput)
    // The lens didn't match
    if (split === null) {
      return {noMatch: NO_CI_MATCH}
    }

    return {result: split[0], ci: concreteInput.substr(split[0].length)}
  }

  put(abstractOutput, concreteInput) {
    const re = new RegExp('^' + this.#match.toString().slice(1,-1))
    //return processSplit(abstractOutput, re, concreteInput, re)
    const res = processSplit(abstractOutput, re, concreteInput, re)
    if (res.splitAo !== undefined) {
      res.result = res.splitAo
    }
    return res
  }

  create(abstractOutput) {
    const re = new RegExp('^' + this.#match.toString().slice(1,-1))
    const split = re.exec(abstractOutput)

    // The lens didn't match
    if (split === null) {
      return {noMatch: NO_AO_MATCH}
    }

    return {
      result: split[0],
      ao: abstractOutput.substr(split[0].length)
    }
  }
}

const processSplit = (abstractOutput, reAo, concreteInput, reCi) => {
    const splitAo = reAo.exec(abstractOutput)
    const splitCi = reCi.exec(concreteInput)

    const res = {
        noMatch: 0
    }
    if (splitAo === null || abstractOutput === undefined) {
      res.noMatch |= NO_AO_MATCH
    }
    else {
      res.ao = abstractOutput.substr(splitAo[0].length)
      //res.result = splitAo[0]
      res.splitAo = splitAo[0]
    }
    if (splitCi === null || concreteInput === undefined) {
      res.noMatch |= NO_CI_MATCH
    }
    else {
      res.ci = concreteInput.substr(splitCi[0].length)
      res.splitCi = splitCi[0]
    }
    if (res.noMatch === 0) {
      delete res.noMatch
    }
    return res
}

// We implement the default lens instead of the const lens.
// The `createFun` is a function that will be called in the create, it has
// one argument which is the abstractOutput. If a string instead of a function
// is supplied, it is a shortcut for `function() {return thestring}`
export class DefaultLens {
  #match
  #out
  #createFun

  constructor(match, out, createFun) {
    this.#match = match
    this.#out = out
    if (typeof createFun === 'string') {
      this.#createFun = () => { return createFun }
    }
    else {
      this.#createFun = createFun
    }
  }

  get(concreteInput) {
    const re = new RegExp('^' + this.#match.toString().slice(1,-1))
    const split = re.exec(concreteInput)
    // The lens didn't match
    if (split === null || concreteInput === undefined) {
      return {noMatch: NO_CI_MATCH}
    }

    return {
      result: this.#out,
      ci: concreteInput.substr(split[0].length)
    }
  }

  put(abstractOutput, concreteInput) {
    // `this.#out` is always just a string
    let out = this.#out
    if (out[0] === '(' || out[0] === ')') {
      out = '\\' + out
    }
    const reAo = new RegExp('^' + out)
    const reCi = new RegExp('^' + this.#match.toString().slice(1,-1))

    const res = processSplit(abstractOutput, reAo, concreteInput, reCi)
    if (res.splitCi !== undefined) {
      res.result = res.splitCi
    }
    return res
  }

  create(abstractOutput) {
    let out = this.#out
    if (out[0] === '(' || out[0] === ')') {
      out = '\\' + out
    }
    const re = new RegExp('^' + out)
    const split = re.exec(abstractOutput)

    // The lens didn't match
    if(split === null) {
      return {noMatch: NO_AO_MATCH}
    }

    if (this.#createFun === undefined) {
      throw("You need to define a `createFun`")
    }

    return {
      result: this.#createFun(abstractOutput),
      ao: abstractOutput.substr(split[0].length)
    }
  }
}

// DelLens takes as second parameter either a function or a string.
// The string is a shortcut for `function() {return thestring}`
export class DelLens extends DefaultLens {
  constructor(match, createFun) {
    super(match, '', createFun)
  }
}

export class InsLens extends DefaultLens {
  constructor(out) {
    super(new RegExp(''), out, () => { return '' })
  }
}

// Combinators
export class ConcatLens {
  #lenses

  constructor(lenses) {
    this.#lenses = lenses
  }

  get(concreteInput) {
    return this.#lenses.reduce((acc, lens, _index, _list) => {
      // XXX vmx 2012-07-23: Is there a better way to "break" the reduce
      //    somehow?
      if (acc === false) {
        return false
      }

      const res = lens.get(acc.ci)
      if ('noMatch' in res) {
        return res
      }

      return {
        result: acc.result + res.result,
        ci: res.ci
      }
    }, {result: '', ci: concreteInput})
  }

  put(abstractOutput, concreteInput) {
    return this.#lenses.reduce((acc, lens, _index, _list) => {
      // XXX vmx 2012-07-23: Is there a better way to "break" the reduce
      //    somehow?
      if (acc === false) {
        return false
      }

      const res = lens.put(acc.ao, acc.ci)
      if ('noMatch' in res) {
        return res
      }

      return {
        result: acc.result + res.result,
        ao: res.ao,
        ci: res.ci
      }
    }, {result: '', ao: abstractOutput, ci: concreteInput})
  }

  create(abstractOutput) {
    return this.#lenses.reduce((acc, lens, _index, _list) => {
      // XXX vmx 2012-07-23: Is there a better way to "break" the reduce
      //    somehow?
      if (acc === false) {
        return false
      }

      const res = lens.create(acc.ao)
      if ('noMatch' in res) {
        return res
      }

      return {
        result: acc.result + res.result,
        ao: res.ao
      }
    }, {result: '', ao: abstractOutput})
  }
}

export class KleeneLens {
  #lens

  constructor(lens) {
    this.#lens = lens
  }

  get(concreteInput) {
    let result = ''
    while(true) {
      const res = this.#lens.get(concreteInput)
      if ('noMatch' in res) {
        break
      }
      result += res.result
      concreteInput = res.ci
    }

    return {
      result: result,
      ci: concreteInput
    }
  }

  put(abstractOutput, concreteInput) {
    let result = ''
    while(true) {
      let res = this.#lens.put(abstractOutput, concreteInput)
      if ('noMatch' in res) {

        if ((res.noMatch & NO_AO_MATCH) && (res.noMatch & NO_CI_MATCH)) {
          // neither ao nor ci match, hence leave the loop
          break
        }
        else {
          // There's still some concrete input, but no corresponding
          // abstract output
          if (res.noMatch & NO_AO_MATCH) {
            delete res.result
          }
          // There's still some abstract output, but not corresponding
          // concrete input
          if (res.noMatch & NO_CI_MATCH) {
            res = this.#lens.create(abstractOutput)
          }
        }
      }
      if (res.result !== undefined) {
        result += res.result
      }
      if (res.ao !== undefined) {
        abstractOutput = res.ao
      }
      if (res.ci !== undefined) {
        concreteInput = res.ci
      }
    }

    return {
      result: result,
      ao: abstractOutput,
      ci: concreteInput
    }
  }

  create(abstractOutput) {
    let result = ''
    while(true) {
      const res = this.#lens.create(abstractOutput)
      if ('noMatch' in res) {
        break
      }
      result += res.result
      abstractOutput = res.ao
    }

    return {
      result: result,
      ao: abstractOutput
    }
  }
}

export class UnionLens {
  #lenses

  constructor(lenses) {
    this.#lenses = lenses
  }

  get(concreteInput) {
    const res = {
      noMatch: NO_CI_MATCH,
      ci: concreteInput
    }

    for (const i in this.#lenses) {
      const lensRes = this.#lenses[i].get(concreteInput)
      // Use first matching lens
      if (!('noMatch' in lensRes)) {
        return lensRes
      }
    }

    return res
  }

// The put is implemented differently from the original dissertation. The
// checks whether the source (concrete input) matched is done right after the
// view (abstract output) matched (as opposed to do it only when several
// views matched).
  put(abstractOutput, concreteInput) {
    const res = {
      // Return no match at all even if one might have matched (but of
      // course it is removed if both matched)
      noMatch: NO_CI_MATCH | NO_AO_MATCH,
      ao: abstractOutput,
      ci: concreteInput
    }

    for (const i in this.#lenses) {
      const lensRes = this.#lenses[i].put(abstractOutput, concreteInput)
      // The lens matched the abstract output and the concrete input
      if (!('noMatch' in lensRes)) {
        return lensRes
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
        lensRes = this.#lenses[i].create(abstractOutput)
        // The `create` doesn't return a concrete input, hence add one
        lensRes.ci = ''
        return lensRes
      }
    }

    return res
  }

  create(abstractOutput) {
    const res = {
      noMatch: NO_AO_MATCH,
      ao: abstractOutput
    }

    for (const i in this.#lenses) {
      const lensRes = this.#lenses[i].create(abstractOutput)
      // The lens matched the abstract output and the concrete input
      if (!('noMatch' in lensRes)) {
        return lensRes
      }
    }

    return res
  }
}
