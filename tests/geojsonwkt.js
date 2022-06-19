import { test } from 'zora';

import { ConcatLens, CopyLens, DefaultLens, DelLens, InsLens, KleeneLens, UnionLens } from '../jslens.js';

test("Real world example: GeoJSON to WKT", (tt) => {
    var typeKey = new DelLens(/"type": /, '"type"');

    // POINT (-9.139386 38.713811)
    // {"type": "Point", "coordinates": [-9.139386, 38.713811]}

    // Apply a given lens to a given value of the given key. It doesn't take
    // a trailing comma into account
    var json_key_value = function(key, lens) {
        return new ConcatLens([
            // XXX vmx 2012-09-15: Somehow the \s+ doesn't work
            //new DelLens(new RegExp('"' + key + '"\s*:\s+'),
            //            '"' + key + '": '),
            new DelLens(new RegExp('"' + key + '": '), '"' + key + '": '),
            lens
        ]);
    };

    var typeLens = new UnionLens([
        new DefaultLens(/"Point"/, 'POINT', '"Point"'),
        new DefaultLens(/"LineString"/, 'LINESTRING', '"LineString"')
    ]);
    var number = new CopyLens(/[+-]?\d+(\.\d+)?/);
    var coordsLens = new ConcatLens([
        new DefaultLens(/\[/, '(', '['),
        number,
        new DefaultLens(/,\s+/, ' ', ', '),
        number,
        new DefaultLens(/\]/, ')', ']')
    ]);

    var lens = new ConcatLens([
        new DelLens(/\{/, '{'),
        json_key_value('type', typeLens),
        new DelLens(/,\s+/, ', '),
        json_key_value('coordinates', coordsLens),
        new DelLens(/\}/, '}')
    ]);

    var get = lens.get('{"type": "Point", "coordinates": [10, 20]}');
    tt.equal(get.result, 'POINT(10 20)', 'lens got correctly converted (get)');
    var put = lens.put('POINT(25 -1)',
        '{"type": "Point", "coordinates": [10, 20]}');
    tt.equal(put.result, '{"type": "Point", "coordinates": [25, -1]}',
          'lens got correctly converted (put)');
    var create = lens.create('POINT(125 8.3)');
    tt.equal(create.result, '{"type": "Point", "coordinates": [125, 8.3]}',
          'lens got correctly converted (create)');
});
