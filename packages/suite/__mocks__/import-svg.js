// https://stackoverflow.com/questions/46791263/jest-test-fail-syntaxerror-unexpected-token
// mock for imported .svg files, see jest.config

module.exports = {
    process() {
        return {
            code: 'module.exports = {};',
        };
    },

    getCacheKey() {
        // The output is always the same.
        return 'svgTransform';
    },
};
