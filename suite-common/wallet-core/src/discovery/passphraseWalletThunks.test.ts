import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { runDiscoveryThunk } from './discoveryThunks';
import { runPassphraseWalletAddingDiscoveryThunk } from './passphraseWalletThunks';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: {
        on: jest.fn(),
        off: jest.fn(),
    },
}));

jest.mock('./discoveryThunks', () => ({
    runDiscoveryThunk: jest.fn(),
    startDiscoveryThunk: jest.fn(),
}));

describe(runPassphraseWalletAddingDiscoveryThunk.name, () => {
    it('uses one callId for the whole discovery flow', async () => {
        const callId = '00000000-0000-4000-8000-000000000000';
        const device = mockSuiteDevice();
        const store = configureMockStore();

        jest.spyOn(crypto, 'randomUUID').mockReturnValue(callId);
        jest.mocked(runDiscoveryThunk).mockReturnValue((() => ({
            unwrap: jest.fn().mockResolvedValue(undefined),
        })) as unknown as ReturnType<typeof runDiscoveryThunk>);

        await store.dispatch(runPassphraseWalletAddingDiscoveryThunk({ device })).unwrap();

        expect(runDiscoveryThunk).toHaveBeenCalledWith({ device, callId });
        expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
        expect(TrezorConnect.on).toHaveBeenCalledTimes(1);
        expect(TrezorConnect.off).toHaveBeenCalledTimes(1);
    });
});
