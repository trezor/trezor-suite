import type { SendStrategy } from '@trezor/network-module-suite-common-types';

/**
 * Synthetic: the levels are fixed examples. A real implementation receives Connect through
 * `NetworkSuiteCommonModuleApi` and estimates them from the backend.
 */
type RippleSendStrategy = SendStrategy;

export const createRippleSendStrategy = (): RippleSendStrategy => ({
    getFeeLevels: () => [{ id: 'normal', value: '12' }],
});
