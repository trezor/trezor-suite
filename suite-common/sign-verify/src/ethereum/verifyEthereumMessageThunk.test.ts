import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import { verifyEthereumMessageThunk } from './verifyEthereumMessageThunk';
import { type SignVerifyRootState } from '../getStateParams';

const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const getState = (): SignVerifyRootState => ({
    device: {
        ...deviceInitialState,
        selectedDevice: mockSuiteDevice({ connected: true, available: true }),
    },
});

describe(verifyEthereumMessageThunk.name, () => {
    let dispatch: jest.Mock;
    let deps: { services: { analytics: ReturnType<typeof mockAnalytics> } };

    beforeEach(() => {
        dispatch = jest.fn();
        deps = { services: { analytics: mockAnalytics() } };
    });

    it('verifies through the Ethereum method', async () => {
        testMocks.setTrezorConnectFixtures({ success: true, payload: { message: MESSAGE } });

        const result = await verifyEthereumMessageThunk({
            account: ACCOUNT,
            address: ADDRESS,
            message: MESSAGE,
            signature: SIGNATURE,
            hex: false,
        })(dispatch, getState, deps);

        expect(result).toBe('verified');
        expect(testMocks.getTrezorConnectMock().ethereumVerifyMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                address: ADDRESS,
                message: MESSAGE,
                signature: SIGNATURE,
                hex: false,
            }),
        );
    });
});
