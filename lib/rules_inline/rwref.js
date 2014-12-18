// process @refType[label](refId)
// consider this an extended links rule.

'use strict';

var parseLinkLabel = require('../helpers/parse_link_label');
var REFTYPE_RE = /^[a-z]{3,16}/;
var REFID_RE = /^[^)]{0,255}/;

module.exports = function rwref(state, silent) {
  var labelStart,
    labelEnd,
    rwrefType,
    rwrefId,
    match,
    pos = state.pos,
    oldPos = state.pos,
    max = state.posMax;

  // @refType[label](refId)
  // ^
  if (state.src.charCodeAt(pos++) !== 0x40/* @ */) { return false; }

  // @refType[label](refId)
  //  ^^^^^^^
  match = state.src.slice(pos).match(REFTYPE_RE);
  if (!match) { return false; }
  rwrefType = match[0];
  pos += match[0].length;

  // @refType[label](refId)
  //         ^^^^^^^
  if (state.src.charCodeAt(pos) !== 0x5B/* [ */) { return false; }
  if (state.level >= state.options.maxNesting) { return false; }
  labelStart = pos + 1;
  labelEnd = parseLinkLabel(state, pos);
  if (labelEnd < 0) { return false; }
  pos = labelEnd + 1;
  if (pos >= max || labelStart === labelEnd) { return false; }

  // @refType[label](refId)
  //                ^
  if (state.src.charCodeAt(pos++) !== 0x28/* ( */) { return false; }

  // @refType[label](refId)
  //                 ^^^^^
  match = state.src.slice(pos).match(REFID_RE);
  if (!match) { return false; }
  rwrefId = match[0];
  pos += match[0].length;

  // @refType[label](refId)
  //                      ^
  if (pos >= max || state.src.charCodeAt(pos++) !== 0x29/* ) */) {
    state.pos = oldPos;
    return false;
  }

  // tokenize.
  if (!silent) {
    state.pos = labelStart;
    state.posMax = labelEnd;
    state.push({
      type: 'rwref_open',
      rwrefType: rwrefType,
      rwrefId: rwrefId,
      level: state.level++
    });
    state.linkLevel++;
    state.parser.tokenize(state);
    state.linkLevel--;
    state.push({ type: 'rwref_close', level: --state.level });
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};
