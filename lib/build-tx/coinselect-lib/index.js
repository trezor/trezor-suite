// I am using coinselect like this; the end-goal is, however, to merge all the changes
// back into the upstream and use coinselect from npm

const accumulative = require('./inputs/accumulative');
const bnb = require('./inputs/bnb');
const sorts = require('./sorts');
const utils = require('./utils');
const tryConfirmed = require('./tryconfirmed');

module.exports = function (inputs, outputs, feeRate, options) {
    inputs = inputs.sort(sorts.score(feeRate));

    const algorithm = tryConfirmed(
    utils.anyOf([bnb(0.5), accumulative]),
    options
  );

    return algorithm(inputs, outputs, feeRate, options);
};
