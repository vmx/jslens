test("CopyLens", function () {
    var lens = new CopyLens(/\d+AA/);
    var get = lens.get('4792AA');
    var put = lens.put('635241AA', '4792AA');
    var create = lens.create('635241AA');

    equal(get.result, '4792AA', 'get result is correct');
    equal(put.result, '635241AA', 'put result is correct');
    equal(create.result, '635241AA', 'create result is correct');
});

test("DefaultLens", function () {
    var lens = new DefaultLens(/A+/, 'B', function() {return 'A';});
    var get = lens.get('AA');
    var put = lens.put('B', 'AA');
    var create = lens.create('B');

    equal(get.result, 'B', 'get result is correct');
    equal(put.result, 'AA', 'put result is correct');
    equal(create.result, 'A', 'create result is correct');
});

test("DelLens", function () {
    var lens = new DelLens(/A+/, function() {return 'A';});
    var get = lens.get('AA');
    var put = lens.put('', 'AA');
    var create = lens.create('');

    equal(get.result, '', 'get result is correct');
    equal(put.result, 'AA', 'put result is correct');
    equal(create.result, 'A', 'create result is correct');
});


test("InsLens", function () {
    var lens = new InsLens('BB')
    var get = lens.get('');
    var put = lens.put('BB', '');
    var create = lens.create('BB');

    equal(get.result, 'BB', 'get result is correct');
    equal(put.result, '', 'put result is correct');
    equal(create.result, '', 'create result is correct');
});


test("ConcatLens with CopyLens", function () {
    var lens = new ConcatLens([new CopyLens(/\d+/), new CopyLens(/B+/)]);
    var get = lens.get('472BBBB');
    var put = lens.put('3627BB', '472BBBB');
    var create = lens.create('3627BB');

    equal(get.result, '472BBBB', 'get result is correct');
    equal(put.result, '3627BB', 'put result is correct');
    equal(create.result, '3627BB', 'create result is correct');
});

test("ConcatLens with CopyLens and DelLens", function () {
    var lens = new ConcatLens([new CopyLens(/\d+/),
        new DelLens(/B+/, function() {return 'B';})]);
    var get = lens.get('472BBBB');
    var put = lens.put('3627', '472BBBB');
    var create = lens.create('3627');

    equal(get.result, '472', 'get result is correct');
    equal(put.result, '3627BBBB', 'put result is correct');
    equal(create.result, '3627B', 'create result is correct');
});

test("ConcatLens with CopyLens and DefaultLens", function () {
    var lens = new ConcatLens([new CopyLens(/\d+/),
        new DefaultLens(/B+/, 'CC', function(){return 'B';})]);
    var get = lens.get('472BBBB');
    var put = lens.put('3627CC', '472BBBB');
    var create = lens.create('3627CC');

    equal(get.result, '472CC', 'get result is correct');
    equal(put.result, '3627BBBB', 'put result is correct');
    equal(create.result, '3627B', 'create result is correct');
});

test("ConcatLens with CopyLens, DefaultLens and InsLens", function () {
    var lens = new ConcatLens([new CopyLens(/\d+/),
        new DefaultLens(/B+/, 'CC', function(){return 'B';}),
                               new InsLens('DDD')]);
    var get = lens.get('472BBBB');
    var put = lens.put('3627CCDDD', '472BBBB');
    var create = lens.create('3627CCDDD');

    equal(get.result, '472CCDDD', 'get result is correct');
    equal(put.result, '3627BBBB', 'put result is correct');
    equal(create.result, '3627B', 'create result is correct');
});


test("KleeneLens", function () {
    var lens = new KleeneLens(new CopyLens(/\dA/));
    var get = lens.get('4A7A2A');
    var put = lens.put('3A6A2A', '4A7A2A');
    var create = lens.create('3A6A2A');

    equal(get.result, '4A7A2A', 'get result is correct');
    equal(put.result, '3A6A2A', 'put result is correct');
    equal(create.result, '3A6A2A', 'create result is correct');
});

test("KleeneLens with rest", function () {
    var lens = new KleeneLens(new CopyLens(/\dA/));
    var get = lens.get('4A7A2ACCC');
    var put = lens.put('3A6A2ADDD', '4A7A2ACCC');
    var create = lens.create('3A6A2ACCC');

    equal(get.result, '4A7A2A', 'get result is correct');
    equal(get.ci, 'CCC', 'get rest (ci) is correct');
    equal(put.result, '3A6A2A', 'put result is correct');
    equal(put.ci, 'CCC', 'put rest (ci) is correct');
    equal(put.ao, 'DDD', 'put rest (ao) is correct');
    equal(create.result, '3A6A2A', 'create result is correct');
    equal(create.ao, 'CCC', 'create rest (ao) is correct');
});

test("KleeneLens put (view smaller than source)", function () {
    var lens = new KleeneLens(new CopyLens(/\dA/));
    var put = lens.put('3A6ADDD', '4A7A2A9A3ACCC');

    equal(put.result, '3A6A', 'put result is correct');
    equal(put.ci, 'CCC', 'put rest (ci) is correct');
    equal(put.ao, 'DDD', 'put rest (ao) is correct');
});

test("KleeneLens put (view bigger than source)", function () {
    var lens = new KleeneLens(new CopyLens(/\dA/));
    var put = lens.put('3A6A5A1A9ADDD', '4A7A2ACCC');

    equal(put.result, '3A6A5A1A9A', 'put result is correct');
    equal(put.ci, 'CCC', 'put rest (ci) is correct');
    equal(put.ao, 'DDD', 'put rest (ao) is correct');
});

test("KleeneLens with ConcatLens", function () {
    var lens = new KleeneLens(new ConcatLens([new CopyLens(/\d/),
        new DefaultLens(/A/, 'B', 'A')]));
    var get = lens.get('4A7A2ACCC');
    var put = lens.put('3B6B2BDDD', '4A7A2ACCC');
    var create = lens.create('3B6B2BCCC');

    equal(get.result, '4B7B2B', 'get result is correct');
    equal(get.ci, 'CCC', 'get rest (ci) is correct');
    equal(put.result, '3A6A2A', 'put result is correct');
    equal(put.ci, 'CCC', 'put rest (ci) is correct');
    equal(put.ao, 'DDD', 'put rest (ao) is correct');
    equal(create.result, '3A6A2A', 'create result is correct');
    equal(create.ao, 'CCC', 'create rest (ao) is correct');
});

test("KleeneLens put with ConcatLens (view bigger than source)", function () {
    var lens = new KleeneLens(new ConcatLens([new CopyLens(/\d/),
        new DefaultLens(/A/, 'B', 'A')]));
    var put = lens.put('3B6B2B7BDDD', '4A7A2ACCC');

    equal(put.result, '3A6A2A7A', 'put result is correct');
    equal(put.ci, 'CCC', 'put rest (ci) is correct');
    equal(put.ao, 'DDD', 'put rest (ao) is correct');
});

test("KleeneLens put with ConcatLens (view smaller than source)", function () {
    var lens = new KleeneLens(new ConcatLens([new CopyLens(/\d/),
        new DefaultLens(/A/, 'B', 'A')]));
    var put = lens.put('3B6BDDD', '4A7A2ACCC');

    equal(put.result, '3A6A', 'put result is correct');
    equal(put.ci, 'CCC', 'put rest (ci) is correct');
    equal(put.ao, 'DDD', 'put rest (ao) is correct');
});


test("UnionLens get with CopyLens", function () {
    var lens = new UnionLens([new CopyLens(/\d+/), new CopyLens(/B+/),
        new CopyLens(/C+/)]);
    var get = lens.get('472BBBBCCC');
    var get2 = lens.get('BBBBCCC37282');
    var get3 = lens.get('CCCBBBB4');
    var get4 = lens.get('nomatch');
    //var put = lens.put('3A6A2A', '4A7A2A');
    //var create = lens.create('3A6A2A');

    equal(get.result, '472', 'get (a) result is correct');
    equal(get.ci, 'BBBBCCC', 'get (a) rest (ci) is correct');
    equal(get2.result, 'BBBB', 'get (b) result is correct');
    equal(get2.ci, 'CCC37282', 'get (b) rest (ci) is correct');
    equal(get3.result, 'CCC', 'get (c) result is correct');
    equal(get3.ci, 'BBBB4', 'get (c) rest (ci) is correct');
    equal(get4.result, undefined, 'get (d) result is correct');
    equal(get4.ci, 'nomatch', 'get (d) rest (ci) is correct');
    notEqual(get4.noMatch, undefined, 'get (d) did not match');
    //equal(put.result, '3A6A2A', 'put result is correct');
    //equal(create.result, '3A6A2A', 'create result is correct');
});

test("UnionLens put with CopyLens", function () {
    var lens = new UnionLens([new CopyLens(/\d+/), new CopyLens(/B+/),
        new CopyLens(/C+/)]);
    var put = lens.put('7482BBCCCCC', '472BBBBCCC');
    var put2 = lens.put('BBCCCCC782', 'BBBBCCC37282');
    var put3 = lens.put('CCCCCBB72', 'CCCBBBB4');
    var put4 = lens.put('noaomatch', 'nocimatch');

    equal(put.result, '7482', 'put (a) result is correct');
    equal(put.ci, 'BBBBCCC', 'put (a) rest (ci) is correct');
    equal(put.ao, 'BBCCCCC', 'put (a) rest (ao) is correct');
    equal(put2.result, 'BB', 'put (b) result is correct');
    equal(put2.ci, 'CCC37282', 'put (b) rest (ci) is correct');
    equal(put2.ao, 'CCCCC782', 'put (b) rest (ao) is correct');
    equal(put3.result, 'CCCCC', 'put (c) result is correct');
    equal(put3.ci, 'BBBB4', 'put (c) rest (ci) is correct');
    equal(put3.ao, 'BB72', 'put (c) rest (ao) is correct');
    equal(put4.result, undefined, 'put (d) result is correct');
    equal(put4.ci, 'nocimatch', 'put (d) rest (ci) is correct');
    equal(put4.ao, 'noaomatch', 'put (d) rest (ao) is correct');
    notEqual(put4.noMatch, undefined, 'put (d) did not match');
});

test("UnionLens create with CopyLens", function () {
    var lens = new UnionLens([new CopyLens(/\d+/), new CopyLens(/B+/),
        new CopyLens(/C+/)]);
    var create = lens.create('7482BBCCCCC');
    var create2 = lens.create('BBCCCCC782');
    var create3 = lens.create('CCCCCBB72');
    var create4 = lens.create('nomatch');

    equal(create.result, '7482', 'create (a) result is correct');
    equal(create.ao, 'BBCCCCC', 'create (a) rest (ao) is correct');
    equal(create2.result, 'BB', 'create (b) result is correct');
    equal(create2.ao, 'CCCCC782', 'create (b) rest (ao) is correct');
    equal(create3.result, 'CCCCC', 'create (c) result is correct');
    equal(create3.ao, 'BB72', 'create (c) rest (ao) is correct');
    equal(create4.result, undefined, 'create (d) result is correct');
    equal(create4.ao, 'nomatch', 'create (d) rest (ao) is correct');
    notEqual(create4.noMatch, undefined, 'create (d) did not match');
});


test("Real world example: GeoJSON to WKT", function () {
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
    equal(get.result, 'POINT(10 20)', 'lens got correctly converted (get)');
    var put = lens.put('POINT(25 -1)',
        '{"type": "Point", "coordinates": [10, 20]}');
    equal(put.result, '{"type": "Point", "coordinates": [25, -1]}',
          'lens got correctly converted (put)');
    var create = lens.create('POINT(125 8.3)');
    equal(create.result, '{"type": "Point", "coordinates": [125, 8.3]}',
          'lens got correctly converted (create)');
});
