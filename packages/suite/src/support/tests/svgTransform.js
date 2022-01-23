// https://stackoverflow.com/questions/46791263/jest-test-fail-syntaxerror-unexpected-token
module.exports = {
    process() {
        return 'module.exports = {};';
    },
    getCacheKey() {
        // The output is always the same.
        return 'svgTransform';
    },
};
