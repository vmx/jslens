var testrunner = require('qunit');

testrunner.run({
    code: './jslens.js',
    tests: [
        './tests/unit.js',
        './tests/geojsonwkt.js'
    ]
});
