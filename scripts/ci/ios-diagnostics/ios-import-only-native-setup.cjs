'use strict';
const chain = new Proxy(function () {}, {
    get(_target, key) {
        if (key === 'then') return undefined;

        return chain;
    },
    apply() { return chain; },
});
global.device = { getPlatform: () => 'ios', id: 'import-only-stub' };
global.element = () => chain;
global.by = chain;
global.waitFor = () => chain;
jest.doMock(require.resolve('detox', { paths: [process.cwd()] }), () => ({
    expect: () => chain,
    device: global.device,
}));
jest.doMock(require.resolve('detox/internals', { paths: [process.cwd()] }), () => ({
    resolveConfig: () => Promise.resolve({ configurationName: 'ios.sim.release' }),
}));
