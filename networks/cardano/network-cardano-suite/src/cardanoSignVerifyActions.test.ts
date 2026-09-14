import { events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type SignVerifyRootState } from '@suite/sign-verify';
import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type AccountWithNetworkType } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { createCardanoSignVerifyActions } from './cardanoSignVerifyActions';

const PATH = "m/1852'/1815'/0'/0/0";
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const PUB_KEY = 'PUB_KEY';
const COSE_KEY = 'COSE_KEY';

const ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('ada'),
}) as AccountWithNetworkType<'cardano'>;

const { signThunk } = createCardanoSignVerifyActions({
    getTrezorConnect: () => testMocks.getTrezorConnectMock(),
});

const CONNECTED_DEVICE = mockSuiteDevice({ connected: true, available: true });

const SIGNED_PAYLOAD = {
    coseSignature: SIGNATURE,
    coseKey: COSE_KEY,
    pubKey: PUB_KEY,
    headers: { protected: { address: ADDRESS } },
};

const createState = (selectedDevice: TrezorDevice | undefined): SignVerifyRootState => ({
    device: { ...deviceInitialState, selectedDevice },
    wallet: { settings: initialWalletSettingsState },
});

describe('Cardano sign actions', () => {
    let dispatch: jest.Mock;
    let deps: { services: { analytics: ReturnType<typeof mockDesktopAnalytics> } };

    const getState = () => createState(CONNECTED_DEVICE);

    beforeEach(() => {
        dispatch = jest.fn();
        deps = { services: { analytics: mockDesktopAnalytics() } };
    });

    it('reports the raw public key when the COSE format is not chosen', async () => {
        testMocks.setTrezorConnectFixtures({ success: true, payload: SIGNED_PAYLOAD });

        const res = await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);

        expect(res).toStrictEqual({
            signature: SIGNATURE,
            pubKey: PUB_KEY,
            address: ADDRESS,
        });
    });

    it('hands back the COSE key when that format is chosen', async () => {
        testMocks.setTrezorConnectFixtures({ success: true, payload: SIGNED_PAYLOAD });

        const res = await signThunk(ACCOUNT, PATH, MESSAGE, false, true)(dispatch, getState, deps);

        expect(res).toStrictEqual({
            signature: SIGNATURE,
            pubKey: COSE_KEY,
            address: ADDRESS,
        });
    });

    it('sends the message to the device as hex', async () => {
        testMocks.setTrezorConnectFixtures({ success: true, payload: SIGNED_PAYLOAD });

        await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);

        expect(testMocks.getTrezorConnectMock().cardanoSignMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                payload: Buffer.from(MESSAGE, 'utf8').toString('hex'),
            }),
        );
    });

    // Cardano signs in a single format, so the signature format attribute is not its to report.
    it('leaves the signature format out', async () => {
        testMocks.setTrezorConnectFixtures({ success: true, payload: SIGNED_PAYLOAD });

        await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);

        expect(deps.services.analytics.report).toHaveBeenCalledWith({
            type: events.coinSignMessageEvent.name,
            payload: { status: 'success', symbol: 'ada', hex: false },
        });
    });

    it('never reports the message, the address or the signature', async () => {
        testMocks.setTrezorConnectFixtures({ success: true, payload: SIGNED_PAYLOAD });

        await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);

        const reported = JSON.stringify(deps.services.analytics.report.mock.calls);

        expect(reported).not.toContain(MESSAGE);
        expect(reported).not.toContain(ADDRESS);
        expect(reported).not.toContain(SIGNATURE);
        expect(reported).not.toContain(PATH);
    });
});
