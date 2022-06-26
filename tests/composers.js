import { test } from 'zora'

import { ConcatLens, CopyLens, DelLens, InsLens, KleeneLens } from '../jslens.js'

test('Real world example: composers', (tt) => {
  // This test is based on the first example in the original dissertation

  // regular expressions
  const WHITESPACE = '[\\n\\t ]'
  const ALPHA = '[A-Za-z]+'
  const YEAR = '[0-9]{4}'

  // helper functions
  const xmlElt = (tag, lens) => {
    return new ConcatLens([
      // The second parameter is for cases when there's no source
      new DelLens(new RegExp(WHITESPACE + '*'), ''),
      new DelLens(new RegExp('<' + tag + '>'), '<foo>'),
      lens,
      new DelLens(new RegExp(WHITESPACE + '*'), ''),
      new DelLens(new RegExp('</' + tag + '>'), '</foo>')
    ])
  }

  // The del_default is not needed as this is how our DelLenses already
  // work. You can supply a default value in case there is no source

  // helper lens
  const composer = xmlElt('composer', new ConcatLens([
    xmlElt('name', new CopyLens(new RegExp(ALPHA + ' ' + ALPHA))),
    new InsLens(', '),
    xmlElt('dates', new CopyLens(new RegExp(YEAR + '-' + YEAR))),
    xmlElt('nationality', new DelLens(new RegExp(ALPHA), 'Unknown'))
  ]))

  // main lens
  const composers = xmlElt('composers', new ConcatLens([
    composer,
    new KleeneLens(new ConcatLens([
      new InsLens('\n'),
      composer
    ]))
  ]))

  const xmlInput = '<composers><composer><name>Jean Sibelius</name><dates>1865-1956</dates><nationality>Finnish</nationality></composer><composer><name>Aaron Copland</name><dates>1910-1990</dates><nationality>American</nationality></composer><composer><name>Benjamin Briten</name><dates>1913-1976</dates><nationality>English</nationality></composer></composers>'
  const getExpected = 'Jean Sibelius, 1865-1956\nAaron Copland, 1910-1990\nBenjamin Briten, 1913-1976'
  const getModified = 'Jean Sibelius, 1865-1957\nAaron Copland, 1910-1990\nBenjamin Britten, 1913-1976'
  const putExpected = '<composers><composer><name>Jean Sibelius</name><dates>1865-1957</dates><nationality>Finnish</nationality></composer><composer><name>Aaron Copland</name><dates>1910-1990</dates><nationality>American</nationality></composer><composer><name>Benjamin Britten</name><dates>1913-1976</dates><nationality>English</nationality></composer></composers>'

  const get = composers.get(xmlInput)
  tt.equal(get.result, getExpected, 'lens got correctly converted (get)')
  const put = composers.put(getModified, xmlInput)
  tt.equal(put.result, putExpected, 'lens got correctly converted (put)')
})
