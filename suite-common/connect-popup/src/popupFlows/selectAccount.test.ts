import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { type PopupFlowParams } from './CommonPopupFlow';
import { SelectAccount } from './selectAccount';
import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { type SelectAccountCandidate } from '../connectPopupTypes';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { call: jest.fn() },
}));

const mockCandidate = (candidate: Partial<SelectAccountCandidate>): SelectAccountCandidate => ({
    symbol: asNetworkSymbol('btc'),
    accountIndex: 0,
    accountTypeKey: 'normal',
    path: "m/84'/0'/0'",
    used: true,
    selected: false,
    loading: false,
    loadFailed: false,
    verifying: false,
    validated: 'not-started',
    ...candidate,
});

const params: PopupFlowParams<'selectAccount'> = {
    method: 'selectAccount',
    payload: { coin: 'btc' },
    source: { type: 'web', origin: 'https://app.example', manifest: { appName: 'app' } },
};

describe('SelectAccount', () => {
    it('answers with the accounts the user selected in the picker', async () => {
        jest.mocked(TrezorConnect.call).mockResolvedValue({ success: true, payload: [] });
        const candidates = [
            mockCandidate({ accountIndex: 0, xpub: 'xpub0' }),
            mockCandidate({ accountIndex: 1, path: "m/84'/0'/1'", xpub: 'xpub1', selected: true }),
        ];
        const dispatch = jest.fn(action => {
            // Stands in for the user confirming the picker.
            if (connectPopupActions.selectAccount.match(action)) getPermissionDeferred().resolve();

            return action;
        });
        const flow = new SelectAccount(params, {
            dispatch,
            getState: () => ({
                device: { selectedDevice: mockSuiteDevice() },
                connectPopup: { activeCall: { state: 'select-account', candidates } },
            }),
        });

        await expect(flow['callMethod'](params.payload)).resolves.toEqual({
            success: true,
            payload: [
                {
                    symbol: 'btc',
                    path: "m/84'/0'/1'",
                    xpub: 'xpub1',
                    accountType: 'normal',
                    address: undefined,
                    mac: undefined,
                },
            ],
        });
        expect(flow['postCall']({ success: true, payload: [] })).toBe(true);
        expect(dispatch).toHaveBeenCalledWith(
            connectPopupActions.updateSelectAccount({ exported: true }),
        );
    });
});
