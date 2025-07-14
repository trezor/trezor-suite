const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Workaround for https://github.com/expo/expo/issues/37171#issuecomment-2958700127
config.resolver.resolveRequest = function packageExportsResolver(context, moduleImport, platform) {
    if (moduleImport === '@sinclair/typebox' || moduleImport.startsWith('@sinclair/typebox/')) {
        return context.resolveRequest(
            { ...context, isESMImport: false }, // Disable ESM resolution, even when using `import ..`
            moduleImport,
            platform,
        );
    }

    // Fall back to normal resolution
    return context.resolveRequest(context, moduleImport, platform);
};

module.exports = config;
