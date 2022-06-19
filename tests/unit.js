import { test } from 'zora';

import { ConcatLens, CopyLens, DefaultLens, DelLens, InsLens, KleeneLens, UnionLens } from '../jslens.js';

test("CopyLens", (tt) => {
    var lens = new CopyLens(/\d+AA/);
    var get = lens.get('4792AA');
    var put = lens.put('635241AA', '4792AA');
    var create = lens.create('635241AA');

    tt.equal(get.result, '4792AA', 'get result is correct');
    tt.equal(put.result, '635241AA', 'put result is correct');
    tt.equal(create.result, '635241AA', 'create result is correct');
});

test("DefaultLens", (tt) => {
    var lens = new DefaultLens(/A+/, 'B', function() {return 'A';});
    var get = lens.get('AA');
    var put = lens.put('B', 'AA');
    var create = lens.create('B');

    tt.equal(get.result, 'B', 'get result is correct');
    tt.equal(put.result, 'AA', 'put result is correct');
    tt.equal(create.result, 'A', 'create result is correct');
});

test("DelLens", (tt) => {
    var lens = new DelLens(/A+/, function() {return 'A';});
    var get = lens.get('AA');
    var put = lens.put('', 'AA');
    var create = lens.create('');

    tt.equal(get.result, '', 'get result is correct');
    tt.equal(put.result, 'AA', 'put result is correct');
    tt.equal(create.result, 'A', 'create result is correct');
});


test("InsLens", (tt) => {
    var lens = new InsLens('BB')
    var get = lens.get('');
    var put = lens.put('BB', '');
    var create = lens.create('BB');

    tt.equal(get.result, 'BB', 'get result is correct');
    tt.equal(put.result, '', 'put result is correct');
    tt.equal(create.result, '', 'create result is correct');
});


test("ConcatLens with CopyLens", (tt) => {
    var lens = new ConcatLens([new CopyLens(/\d+/), new CopyLens(/B+/)]);
    var get = lens.get('472BBBB');
    var put = lens.put('3627BB', '472BBBB');
    var create = lens.create('3627BB');

    tt.equal(get.result, '472BBBB', 'get result is correct');
    tt.equal(put.result, '3627BB', 'put result is correct');
    tt.equal(create.result, '3627BB', 'create result is correct');
});

test("ConcatLens with CopyLens and DelLens", (tt) => {
    var lens = new ConcatLens([new CopyLens(/\d+/),
        new DelLens(/B+/, function() {return 'B';})]);
    var get = lens.get('472BBBB');
    var put = lens.put('3627', '472BBBB');
    var create = lens.create('3627');

    tt.equal(get.result, '472', 'get result is correct');
    tt.equal(put.result, '3627BBBB', 'put result is correct');
    tt.equal(create.result, '3627B', 'create result is correct');
});

test("ConcatLens with CopyLens and DefaultLens", (tt) => {
    var lens = new ConcatLens([new CopyLens(/\d+/),
        new DefaultLens(/B+/, 'CC', function(){return 'B';})]);
    var get = lens.get('472BBBB');
    var put = lens.put('3627CC', '472BBBB');
    var create = lens.create('3627CC');

    tt.equal(get.result, '472CC', 'get result is correct');
    tt.equal(put.result, '3627BBBB', 'put result is correct');
    tt.equal(create.result, '3627B', 'create result is correct');
});

test("ConcatLens with CopyLens, DefaultLens and InsLens", (tt) => {
    var lens = new ConcatLens([new CopyLens(/\d+/),
        new DefaultLens(/B+/, 'CC', function(){return 'B';}),
                              new InsLens('DDD')]);
    var get = lens.get('472BBBB');
    var put = lens.put('3627CCDDD', '472BBBB');
    var create = lens.create('3627CCDDD');

    tt.equal(get.result, '472CCDDD', 'get result is correct');
    tt.equal(put.result, '3627BBBB', 'put result is correct');
    tt.equal(create.result, '3627B', 'create result is correct');
});


test("KleeneLens", (tt) => {
    var lens = new KleeneLens(new CopyLens(/\dA/));
    var get = lens.get('4A7A2A');
    var put = lens.put('3A6A2A', '4A7A2A');
    var create = lens.create('3A6A2A');

    tt.equal(get.result, '4A7A2A', 'get result is correct');
    tt.equal(put.result, '3A6A2A', 'put result is correct');
    tt.equal(create.result, '3A6A2A', 'create result is correct');
});

test("KleeneLens with rest", (tt) => {
    var lens = new KleeneLens(new CopyLens(/\dA/));
    var get = lens.get('4A7A2ACCC');
    var put = lens.put('3A6A2ADDD', '4A7A2ACCC');
    var create = lens.create('3A6A2ACCC');

    tt.equal(get.result, '4A7A2A', 'get result is correct');
    tt.equal(get.ci, 'CCC', 'get rest (ci) is correct');
    tt.equal(put.result, '3A6A2A', 'put result is correct');
    tt.equal(put.ci, 'CCC', 'put rest (ci) is correct');
    tt.equal(put.ao, 'DDD', 'put rest (ao) is correct');
    tt.equal(create.result, '3A6A2A', 'create result is correct');
    tt.equal(create.ao, 'CCC', 'create rest (ao) is correct');
});

test("KleeneLens put (view smaller than source)", (tt) => {
    var lens = new KleeneLens(new CopyLens(/\dA/));
    var put = lens.put('3A6ADDD', '4A7A2A9A3ACCC');

    tt.equal(put.result, '3A6A', 'put result is correct');
    tt.equal(put.ci, 'CCC', 'put rest (ci) is correct');
    tt.equal(put.ao, 'DDD', 'put rest (ao) is correct');
});

test("KleeneLens put (view bigger than source)", (tt) => {
    var lens = new KleeneLens(new CopyLens(/\dA/));
    var put = lens.put('3A6A5A1A9ADDD', '4A7A2ACCC');

    tt.equal(put.result, '3A6A5A1A9A', 'put result is correct');
    tt.equal(put.ci, 'CCC', 'put rest (ci) is correct');
    tt.equal(put.ao, 'DDD', 'put rest (ao) is correct');
});

test("KleeneLens with ConcatLens", (tt) => {
    var lens = new KleeneLens(new ConcatLens([new CopyLens(/\d/),
        new DefaultLens(/A/, 'B', 'A')]));
    var get = lens.get('4A7A2ACCC');
    var put = lens.put('3B6B2BDDD', '4A7A2ACCC');
    var create = lens.create('3B6B2BCCC');

    tt.equal(get.result, '4B7B2B', 'get result is correct');
    tt.equal(get.ci, 'CCC', 'get rest (ci) is correct');
    tt.equal(put.result, '3A6A2A', 'put result is correct');
    tt.equal(put.ci, 'CCC', 'put rest (ci) is correct');
    tt.equal(put.ao, 'DDD', 'put rest (ao) is correct');
    tt.equal(create.result, '3A6A2A', 'create result is correct');
    tt.equal(create.ao, 'CCC', 'create rest (ao) is correct');
});

test("KleeneLens put with ConcatLens (view bigger than source)", (tt) => {
    var lens = new KleeneLens(new ConcatLens([new CopyLens(/\d/),
        new DefaultLens(/A/, 'B', 'A')]));
    var put = lens.put('3B6B2B7BDDD', '4A7A2ACCC');

    tt.equal(put.result, '3A6A2A7A', 'put result is correct');
    tt.equal(put.ci, 'CCC', 'put rest (ci) is correct');
    tt.equal(put.ao, 'DDD', 'put rest (ao) is correct');
});

test("KleeneLens put with ConcatLens (view smaller than source)", (tt) => {
    var lens = new KleeneLens(new ConcatLens([new CopyLens(/\d/),
        new DefaultLens(/A/, 'B', 'A')]));
    var put = lens.put('3B6BDDD', '4A7A2ACCC');

    tt.equal(put.result, '3A6A', 'put result is correct');
    tt.equal(put.ci, 'CCC', 'put rest (ci) is correct');
    tt.equal(put.ao, 'DDD', 'put rest (ao) is correct');
});


test("UnionLens get with CopyLens", (tt) => {
    var lens = new UnionLens([new CopyLens(/\d+/), new CopyLens(/B+/),
        new CopyLens(/C+/)]);
    var get = lens.get('472BBBBCCC');
    var get2 = lens.get('BBBBCCC37282');
    var get3 = lens.get('CCCBBBB4');
    var get4 = lens.get('nomatch');
    //var put = lens.put('3A6A2A', '4A7A2A');
    //var create = lens.create('3A6A2A');

    tt.equal(get.result, '472', 'get (a) result is correct');
    tt.equal(get.ci, 'BBBBCCC', 'get (a) rest (ci) is correct');
    tt.equal(get2.result, 'BBBB', 'get (b) result is correct');
    tt.equal(get2.ci, 'CCC37282', 'get (b) rest (ci) is correct');
    tt.equal(get3.result, 'CCC', 'get (c) result is correct');
    tt.equal(get3.ci, 'BBBB4', 'get (c) rest (ci) is correct');
    tt.equal(get4.result, undefined, 'get (d) result is correct');
    tt.equal(get4.ci, 'nomatch', 'get (d) rest (ci) is correct');
    tt.notEqual(get4.noMatch, undefined, 'get (d) did not match');
    //tt.equal(put.result, '3A6A2A', 'put result is correct');
    //tt.equal(create.result, '3A6A2A', 'create result is correct');
});

test("UnionLens put with CopyLens", (tt) => {
    var lens = new UnionLens([new CopyLens(/\d+/), new CopyLens(/B+/),
        new CopyLens(/C+/)]);
    var put = lens.put('7482BBCCCCC', '472BBBBCCC');
    var put2 = lens.put('BBCCCCC782', 'BBBBCCC37282');
    var put3 = lens.put('CCCCCBB72', 'CCCBBBB4');
    var put4 = lens.put('noaomatch', 'nocimatch');

    tt.equal(put.result, '7482', 'put (a) result is correct');
    tt.equal(put.ci, 'BBBBCCC', 'put (a) rest (ci) is correct');
    tt.equal(put.ao, 'BBCCCCC', 'put (a) rest (ao) is correct');
    tt.equal(put2.result, 'BB', 'put (b) result is correct');
    tt.equal(put2.ci, 'CCC37282', 'put (b) rest (ci) is correct');
    tt.equal(put2.ao, 'CCCCC782', 'put (b) rest (ao) is correct');
    tt.equal(put3.result, 'CCCCC', 'put (c) result is correct');
    tt.equal(put3.ci, 'BBBB4', 'put (c) rest (ci) is correct');
    tt.equal(put3.ao, 'BB72', 'put (c) rest (ao) is correct');
    tt.equal(put4.result, undefined, 'put (d) result is correct');
    tt.equal(put4.ci, 'nocimatch', 'put (d) rest (ci) is correct');
    tt.equal(put4.ao, 'noaomatch', 'put (d) rest (ao) is correct');
    tt.notEqual(put4.noMatch, undefined, 'put (d) did not match');
});

test("UnionLens create with CopyLens", (tt) => {
    var lens = new UnionLens([new CopyLens(/\d+/), new CopyLens(/B+/),
        new CopyLens(/C+/)]);
    var create = lens.create('7482BBCCCCC');
    var create2 = lens.create('BBCCCCC782');
    var create3 = lens.create('CCCCCBB72');
    var create4 = lens.create('nomatch');

    tt.equal(create.result, '7482', 'create (a) result is correct');
    tt.equal(create.ao, 'BBCCCCC', 'create (a) rest (ao) is correct');
    tt.equal(create2.result, 'BB', 'create (b) result is correct');
    tt.equal(create2.ao, 'CCCCC782', 'create (b) rest (ao) is correct');
    tt.equal(create3.result, 'CCCCC', 'create (c) result is correct');
    tt.equal(create3.ao, 'BB72', 'create (c) rest (ao) is correct');
    tt.equal(create4.result, undefined, 'create (d) result is correct');
    tt.equal(create4.ao, 'nomatch', 'create (d) rest (ao) is correct');
    tt.notEqual(create4.noMatch, undefined, 'create (d) did not match');
});
