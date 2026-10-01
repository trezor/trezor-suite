import type { SendStrategy } from '@trezor/network-module-suite-common-types';

/**
 * Synthetic: the levels are fixed examples. A real implementation receives Connect through
 * `NetworkSuiteCommonModuleApi` and estimates them from the backend.
 */
type BitcoinSendStrategy = SendStrategy;

export const createBitcoinSendStrategy = (): BitcoinSendStrategy => ({
    getFeeLevels: () => [
        { id: 'economy', value: '1' },
        { id: 'normal', value: '5' },
        { id: 'high', value: '10' },
    ],
});
