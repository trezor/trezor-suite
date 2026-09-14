import { events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type SignVerifyRootState } from '@suite/sign-verify';
import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { createEthereumSignVerifyActions } from './ethereumSignVerifyActions';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const { signThunk, verifyThunk } = createEthereumSignVerifyActions({
    getTrezorConnect: () => testMocks.getTrezorConnectMock(),
});

const CONNECTED_DEVICE = mockSuiteDevice({ connected: true, available: true });

const createState = (selectedDevice: TrezorDevice | undefined): SignVerifyRootState => ({
    device: { ...deviceInitialState, selectedDevice },
    wallet: { settings: initialWalletSettingsState },
});

describe('Ethereum sign/verify actions', () => {
    let dispatch: jest.Mock;
    let deps: { services: { analytics: ReturnType<typeof mockDesktopAnalytics> } };

    const getState = () => createState(CONNECTED_DEVICE);

    beforeEach(() => {
        dispatch = jest.fn();
        deps = { services: { analytics: mockDesktopAnalytics() } };
    });

    it('sign', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { address: ADDRESS, signature: SIGNATURE },
        });

        const res = await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);

        expect(res).toStrictEqual({ address: ADDRESS, signature: SIGNATURE });
    });

    it('verify', async () => {
        testMocks.setTrezorConnectFixtures({ success: true, payload: { message: MESSAGE } });

        const res = await verifyThunk(
            ACCOUNT,
            ADDRESS,
            MESSAGE,
            SIGNATURE,
        )(dispatch, getState, deps);

        expect(res).toStrictEqual('verified');
    });

    // Ethereum signs in a single format, so reporting one would invent an answer the user never
    // gave; the attribute belongs to the networks that offer the choice.
    it('leaves the signature format out', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { address: ADDRESS, signature: SIGNATURE },
        });

        await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);

        expect(deps.services.analytics.report).toHaveBeenCalledWith({
            type: events.coinSignMessageEvent.name,
            payload: { status: 'success', symbol: 'eth', hex: false },
        });
    });

    it('never reports the message, the address or the signature', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { address: ADDRESS, signature: SIGNATURE },
        });

        await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);
        await verifyThunk(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE)(dispatch, getState, deps);

        const reported = JSON.stringify(deps.services.analytics.report.mock.calls);

        expect(reported).not.toContain(MESSAGE);
        expect(reported).not.toContain(ADDRESS);
        expect(reported).not.toContain(SIGNATURE);
        expect(reported).not.toContain(PATH);
    });
});
