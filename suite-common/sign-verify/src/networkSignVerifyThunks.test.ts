import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import { signThunk, verifyThunk } from './networkSignVerifyThunks';
import { type SignVerifyRootState } from './signVerifyActions';

const getState = (): SignVerifyRootState => ({
    device: {
        ...deviceInitialState,
        selectedDevice: mockSuiteDevice({ connected: true, available: true }),
    },
});

describe('network sign/verify thunks', () => {
    let dispatch: jest.Mock;
    let deps: { services: { analytics: ReturnType<typeof mockAnalytics> } };

    const connect = () => testMocks.getTrezorConnectMock();

    beforeEach(() => {
        dispatch = jest.fn();
        deps = { services: { analytics: mockAnalytics() } };
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { address: 'ADDRESS', signature: 'SIGNATURE' },
        });
    });

    it('signs with the Ethereum method for an Ethereum account', async () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

        await signThunk(account, account.path, 'MESSAGE')(dispatch, getState, deps);

        expect(connect().ethereumSignMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({ path: account.path, message: 'MESSAGE' }),
        );
    });

    it('verifies with the Bitcoin method for a Bitcoin account', async () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

        await verifyThunk(account, 'ADDRESS', 'MESSAGE', 'SIGNATURE')(dispatch, getState, deps);

        expect(connect().verifyMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({ address: 'ADDRESS', signature: 'SIGNATURE' }),
        );
    });

    it.each(['sol', 'xrp'])('fails to sign on a network without signing (%s)', async symbol => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol(symbol) });

        expect(await signThunk(account, account.path, 'MESSAGE')(dispatch, getState, deps)).toBe(
            false,
        );
    });

    it('fails to verify on a network without verification', async () => {
        const account = mockWalletAccount({ symbol: asNetworkSymbol('ada') });

        expect(
            await verifyThunk(account, 'ADDRESS', 'MESSAGE', 'SIGNATURE')(dispatch, getState, deps),
        ).toBe('failed');
    });
});
