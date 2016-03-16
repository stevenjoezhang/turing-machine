'use strict';

var jsyaml = require('js-yaml'),
    _ = require('lodash/fp');

// SVGSVGElement -> string
function dataURIFromSVG(svg) {
  // XXX:
  if (!svg.getAttribute('version')) {
    svg.setAttribute('version', '1.1');
  }
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  var xml = '<?xml version="1.0"?>\n' + svg.outerHTML;
  return 'data:image/svg+xml;,' + encodeURIComponent(xml);
}

// function downloadSVG(svg, name, link) {
//   link.href = dataURIFromSVG(svg);
//   link.download = name;
//   link.target = '_blank'; // in case download fails
// }

// Document Serialization

var docToYaml = {
  name: 'name',
  sourceCode: 'source code',
  positionTable: 'positions',
  editorSourceCode: 'editor contents'
};
var yamlToDoc = _.invert(docToYaml);

// like _.mapKeys, but only using the keys specified in a mapping object.
// {[key: string] -> string} -> ?Object -> Object
function mapKeys(mapping) {
  return function (input) {
    var output = {};
    if (input != null) {
      Object.keys(mapping).forEach(function (fromKey) {
        var toKey = mapping[fromKey];
        output[toKey] = input[fromKey];
      });
    }
    return output;
  };
}

// we want parseDocument . stringifyDocument = identity, up to null == undefined.

/**
 * Serialize a document.
 * @param  {TMDocument} doc document to serialize
 * @return {string}
 */
var stringifyDocument = _.flow(
  mapKeys(docToYaml),
  _.omitBy(function (x) { return x == null; }),
  // NB. lodash/fp/partialRight takes an array of arguments.
  _.partialRight(jsyaml.safeDump, [{
    flowLevel: 2, // positions: one state per line
    noCompatMode: true // use "y:" instead of "'y':"
  }])
);

/**
 * Deserialize a document.
 * @param  {string} str    serialized document
 * @return {Object}        data usable in TMDocument.copyFrom()
 * @throws {YAMLException} on YAML syntax error
 * @throws {TypeError}     when missing "source code" string property
 */
var parseDocument = _.flow(
  jsyaml.safeLoad,
  mapKeys(yamlToDoc),
  checkData
);

// throw if "source code" attribute is missing or not a string
function checkData(obj) {
  if (obj == null || obj.sourceCode == null) {
    throw new TypeError('missing "source code:" value');
  } else if (!_.isString(obj.sourceCode)) {
    throw new TypeError('"source code:" value needs to be of type string');
  }
  return obj;
}

exports.dataURIFromSVG = dataURIFromSVG;
exports.stringifyDocument = stringifyDocument;
exports.parseDocument = parseDocument;
