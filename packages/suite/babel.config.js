module.exports = api => {
    api.cache(true);
    // apparently this config is needed for jest

    return {
        // transformIgnorePatterns: ['<rootDir>/node_modules/'],
        presets: ['next/babel'],
        plugins: [],
    };
};
