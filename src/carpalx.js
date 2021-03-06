var fs = require('fs');
var readline = require('readline');
var utils = require('./utils');
var layouts = require('./layout').layouts;
var StringMap  = require('stringmap');

/**
 * Normalise input, keep only letters
 * @param String str
 **/
function normalise(str) {
  return str.replace(/[^a-zA-Z]+/g, '').toLowerCase();
}

/**
 * Parse line to triads.
 * A string of "test" will increase "tes","est" triads by 1 and return '' as remnant
 *
 * @param String ln line to read
 * @param StringMap triads
 * @return String remnant
 */
function parse(ln, triads) {
  // move to next line
  if (ln.length < 3 ) {
      return ln;
  }

  // increase appearance of triad
  var t = ln.slice(0,3);
  var c = 1;
      if (triads.has(t)) {
      c = triads.get(t);
      c++;
  }
  triads.set(t, c);

  // move to next triad of line
  return parse(ln.substr(1), triads);
}

/**
 * Map file to triads
 *
 * @param String file path
 * @param Function done callback when mapping is done
 **/
function map(path, done) {
  console.log('Mapping:', path);

  var file = readline.createInterface({
    input: fs.createReadStream(path, { encoding: 'utf8', flag: 'r' }),
    output: process.stdout,
    terminal: false
  });

  var triads = new StringMap();
  var remnant = '';
  var count = 0;

  file.on('line', function(line) {
    // keep character lines
    count += line.length;
    remnant = parse(normalise(remnant+line), triads);
  });

  file.on('close', function() {
    console.log('Result in:');
    console.log('- Unique triads:', triads.size());
    console.log('- Total triads:', triads.values().reduce(utils.sum));
    console.log('- Total characters:', count);
    done(triads, count);
  });
}

function reduce(layouts) {

  return function(triads, count) {
    var n = utils.multiply;
    var N = utils.N(count);

    var results = layouts.map(function(layout) {
      var ei = utils.e(layout);
      return [ layout.name(), N(triads.map(function(value, key) {
          return n(value)(ei(key));
        }).reduce(utils.sum))
      ];
    });

    console.log('Type effort for layouts (lower is better)');
    console.log(results);
  };
}

module.exports = function(path) {
  map(path, reduce(layouts));
};
