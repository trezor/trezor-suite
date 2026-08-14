import type TrezorConnect from '@trezor/connect';

/**
 * Connect as an injected service, narrowed to the calls its consumers make so that they can be
 * tested with a plain object instead of a mocked module. Widen the pick as more of them stop
 * importing the singleton directly.
 */
export type TrezorConnectDep = {
    trezorConnect: Pick<typeof TrezorConnect, 'getFeatures'>;
};

/**
 * The whole module, for a composition root: it is the one place that holds the singleton and hands
 * out the narrow picks above to everything it builds.
 */
export type TrezorConnectModuleDep = {
    trezorConnect: typeof TrezorConnect;
};
