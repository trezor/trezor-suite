import type { SendStrategy } from '@trezor/network-module-suite-common-types';

/**
 * Synthetic: the levels are fixed examples. A real implementation receives Connect through
 * `NetworkSuiteCommonModuleApi` and estimates them from the backend.
 */
type SolanaSendStrategy = SendStrategy;

export const createSolanaSendStrategy = (): SolanaSendStrategy => ({
    getFeeLevels: () => [
        { id: 'none', value: '0' },
        { id: 'normal', value: '1000' },
        { id: 'high', value: '10000' },
    ],
});
