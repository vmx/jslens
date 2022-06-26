import { test } from 'zora'

import { ConcatLens, CopyLens, DefaultLens, DelLens, UnionLens } from '../jslens.js'

test('Real world example: GeoJSON to WKT', (tt) => {
  // POINT (-9.139386 38.713811)
  // {"type": "Point", "coordinates": [-9.139386, 38.713811]}

  // Apply a given lens to a given value of the given key. It doesn't take
  // a trailing comma into account
  const jsonKeyValue = (key, lens) => {
    return new ConcatLens([
      // XXX vmx 2012-09-15: Somehow the \s+ doesn't work
      // new DelLens(new RegExp('"' + key + '"\s*:\s+'),
      //            '"' + key + '": '),
      new DelLens(new RegExp('"' + key + '": '), '"' + key + '": '),
      lens
    ])
  }

  const typeLens = new UnionLens([
    new DefaultLens(/"Point"/, 'POINT', '"Point"'),
    new DefaultLens(/"LineString"/, 'LINESTRING', '"LineString"')
  ])
  const number = new CopyLens(/[+-]?\d+(\.\d+)?/)
  const coordsLens = new ConcatLens([
    new DefaultLens(/\[/, '(', '['),
    number,
    new DefaultLens(/,\s+/, ' ', ', '),
    number,
    new DefaultLens(/\]/, ')', ']')
  ])

  const lens = new ConcatLens([
    new DelLens(/\{/, '{'),
    jsonKeyValue('type', typeLens),
    new DelLens(/,\s+/, ', '),
    jsonKeyValue('coordinates', coordsLens),
    new DelLens(/\}/, '}')
  ])

  const get = lens.get('{"type": "Point", "coordinates": [10, 20]}')
  tt.equal(get.result, 'POINT(10 20)', 'lens got correctly converted (get)')
  const put = lens.put('POINT(25 -1)',
    '{"type": "Point", "coordinates": [10, 20]}')
  tt.equal(put.result, '{"type": "Point", "coordinates": [25, -1]}',
    'lens got correctly converted (put)')
  const create = lens.create('POINT(125 8.3)')
  tt.equal(create.result, '{"type": "Point", "coordinates": [125, 8.3]}',
    'lens got correctly converted (create)')
})
