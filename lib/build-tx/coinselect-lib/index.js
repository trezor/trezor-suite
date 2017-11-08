'use strict';

// I am using coinselect like this; the end-goal is, however, to merge all the changes
// back into the upstream and use coinselect from npm

var accumulative = require('./inputs/accumulative');
var bnb = require('./inputs/bnb');
var sorts = require('./sorts');
var utils = require('./utils');
var tryConfirmed = require('./tryconfirmed');

module.exports = function (inputs, outputs, feeRate, options) {
    inputs = inputs.sort(sorts.score(feeRate));

    var algorithm = tryConfirmed(utils.anyOf([bnb(0.5), accumulative]), options);

    return algorithm(inputs, outputs, feeRate, options);
};