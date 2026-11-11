import { events } from '@suite-common/analytics';
import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import { signEthereumMessageThunk, verifyEthereumMessageThunk } from './ethereumSignVerifyThunks';
import { type SignVerifyRootState } from '../signVerifyRootState';

const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth'), path: "m/44'/60'/0'/0/7" });

const getState = (): SignVerifyRootState => ({
    device: {
        ...deviceInitialState,
        selectedDevice: mockSuiteDevice({ connected: true, available: true }),
    },
});

describe('Ethereum sign/verify thunks', () => {
    let dispatch: jest.Mock;
    let deps: { services: { analytics: ReturnType<typeof mockAnalytics> } };

    const connect = () => testMocks.getTrezorConnectMock();

    beforeEach(() => {
        dispatch = jest.fn();
        deps = { services: { analytics: mockAnalytics() } };
    });

    it('signs with the account path and reports no signature format', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { address: ADDRESS, signature: SIGNATURE },
        });

        const result = await signEthereumMessageThunk({
            account: ACCOUNT,
            message: MESSAGE,
            hex: true,
        })(dispatch, getState, deps);

        expect(result).toStrictEqual({ address: ADDRESS, signature: SIGNATURE });
        expect(connect().ethereumSignMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({ path: ACCOUNT.path, message: MESSAGE, hex: true }),
        );
        expect(deps.services.analytics.report).toHaveBeenCalledWith({
            type: events.coinSignMessageEvent.name,
            payload: { status: 'success', symbol: 'eth', hex: true },
        });
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
        expect(connect().ethereumVerifyMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                address: ADDRESS,
                message: MESSAGE,
                signature: SIGNATURE,
                hex: false,
            }),
        );
    });
});
