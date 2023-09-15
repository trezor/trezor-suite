const { bech32, bech32m } = require('bech32');

function convertbits(data, frombits, tobits, pad) {
  var acc = 0;
  var bits = 0;
  var ret = [];
  var maxv = (1 << tobits) - 1;
  for (var p = 0; p < data.length; ++p) {
    var value = data[p];
    if (value < 0 || (value >> frombits) !== 0) {
      return null;
    }
    acc = (acc << frombits) | value;
    bits += frombits;
    while (bits >= tobits) {
      bits -= tobits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) {
      ret.push((acc << (tobits - bits)) & maxv);
    }
  } else if (bits >= frombits || ((acc << (tobits - bits)) & maxv)) {
    return null;
  }
  return ret;
}

function decode(hrp, addr, m = false) {
    let dec;
    try {
        if (m) {
            dec = bech32m.decode(addr);
        } else {
            dec = bech32.decode(addr);
        }
    } catch (err) {
        return null;
    }
    if (
        dec === null ||
        dec.prefix !== hrp ||
        dec.words.length < 1 ||
        dec.words[0] > 16
    ) {
        return null;
    }
    var res = convertbits(dec.words.slice(1), 5, 8, false);
    if (res === null || res.length < 2 || res.length > 40) {
        return null;
    }
    return { version: dec.words[0], program: res };
}

function encode(hrp, version, program, m = false) {
    var ret;
    if (m) {
        ret = bech32m.encode(hrp, [version].concat(convertbits(program, 8, 5, true)));
    } else {
        ret = bech32.encode( hrp, [version].concat(convertbits(program, 8, 5, true)));
    }
    if (decode(hrp, ret, m) === null) {
        return null;
    }
    return ret;
}

module.exports = { decode, encode };