const fs = require('fs');
const path = require('path');

function findRepoRoot(start) {
    let dir = start;
    while (dir !== path.parse(dir).root) {
        if (fs.existsSync(path.join(dir, 'JestCustomEnv.js'))) return dir;
        dir = path.dirname(dir);
    }
    throw new Error('Could not locate repo root.');
}
const repoRoot = findRepoRoot(__dirname);

const swcConfig = {
    jsc: {
        parser: { syntax: 'typescript', tsx: true, decorators: true },
        transform: { react: { runtime: 'automatic' }, decoratorVersion: '2022-03' },
        target: 'esnext',
    },
    module: { type: 'commonjs' },
};

module.exports = {
    rootDir: process.cwd(),
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '/lib/', '/dist/', '/build/', '/coverage/'],
    transform: { '\\.(js|jsx|ts|tsx)$': [require.resolve('@swc/jest'), swcConfig] },
    transformIgnorePatterns: ['node_modules/?!(uuid|react-intl|@formatjs/*|intl-messageformat)/'],
    modulePathIgnorePatterns: ['libDev'],
    moduleNameMapper: {
        '^reselect$': path.join(repoRoot, 'suite-native/test-utils/src/mocks/reselectMock.ts'),
        '^bcrypto/lib/(.*)$': 'bcrypto/lib/$1-browser',
        '^uint8array-tools$': require.resolve('uint8array-tools'),
        '^usb$': path.join(repoRoot, 'packages/transport/mocks/usb.cjs'),
    },
    testEnvironment: path.join(repoRoot, 'JestCustomEnv.js'),
};
