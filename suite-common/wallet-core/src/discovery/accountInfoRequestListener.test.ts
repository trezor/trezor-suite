import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect, {
    type AccountInfo,
    type DiscoveryAccountInfoParams,
    type StaticSessionId,
    UI_RESPONSE,
} from '@trezor/connect';
import { createDeferred } from '@trezor/utils';

import { createAccountInfoRequestListener } from './accountInfoRequestListener';
import { type BlockchainRootState, blockchainInitialState } from '../blockchain/blockchainReducer';

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: { ...actual.default, uiResponse: jest.fn() },
    };
});
jest.mock('@trezor/blockchain-core', () => ({
    TrezorBlockchain: { getAccountInfo: jest.fn() },
}));

const getAccountInfo = jest.mocked(TrezorBlockchain.getAccountInfo);

const CALL_ID = 'discovery-call';
const REQUEST_ID = 'request-id';
const DEVICE_STATE: StaticSessionId = 'mmcGdEpTPqgQNRHqf3gmB5uDsEoPo2d3tp@device-id:0';

const state: BlockchainRootState = {
    wallet: {
        blockchain: {
            ...blockchainInitialState,
            btc: { ...blockchainInitialState.btc, backends: { gapLimit: 30 } },
            eth: { ...blockchainInitialState.eth, backends: { selected: 'evm-rpc' } },
        },
    },
};

const accountInfo: AccountInfo = {
    descriptor: 'descriptor',
    balance: '0',
    availableBalance: '0',
    empty: true,
    history: { total: 0, unconfirmed: 0 },
};

// Lets the listener answer a request of the given call and resolves once it has answered.
const requestAccountInfo = async (params: DiscoveryAccountInfoParams, callId = CALL_ID) => {
    const answered = createDeferred();
    jest.mocked(TrezorConnect.uiResponse).mockImplementation(() => answered.resolve());
    const onRequest = createAccountInfoRequestListener({
        callId: CALL_ID,
        deviceState: DEVICE_STATE,
        getState: () => state,
    });

    onRequest({ ...params, requestId: REQUEST_ID, callId });
    if (callId === CALL_ID) await answered.promise;
};

describe(createAccountInfoRequestListener.name, () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('answers with the response of reading the account with Suite page size and gap', async () => {
        getAccountInfo.mockResolvedValue({ success: true, payload: accountInfo });

        await requestAccountInfo({ coin: 'btc', descriptor: 'xpub' });

        expect(getAccountInfo).toHaveBeenCalledWith({
            coin: 'btc',
            descriptor: 'xpub',
            details: 'txs',
            pageSize: 25,
            gap: 30,
        });
        expect(TrezorConnect.uiResponse).toHaveBeenCalledWith({
            type: UI_RESPONSE.RECEIVE_DISCOVERY_ACCOUNT_INFO,
            payload: { success: true, payload: accountInfo },
            requestId: REQUEST_ID,
        });
    });

    it.each<[string, DiscoveryAccountInfoParams]>([
        ['on a direct RPC backend', { coin: 'eth', descriptor: '0x0' }],
        ['when asked', { coin: 'btc', descriptor: 'xpub', details: 'basic' }],
    ])('reads only the basic details %s', async (_, params) => {
        getAccountInfo.mockResolvedValue({ success: true, payload: accountInfo });

        await requestAccountInfo(params);

        expect(getAccountInfo).toHaveBeenCalledWith(expect.objectContaining({ details: 'basic' }));
    });

    it('reads an Ethereum account with the identity of the wallet and the vault protocol', async () => {
        getAccountInfo.mockResolvedValue({ success: true, payload: accountInfo });

        await requestAccountInfo({ coin: 'eth', descriptor: '0x0' });

        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                identity: tryGetAccountIdentity({
                    networkType: 'ethereum',
                    deviceState: DEVICE_STATE,
                }),
                protocols: ['erc4626'],
            }),
        );
    });

    it('answers with an error when reading the account rejects', async () => {
        getAccountInfo.mockRejectedValue(new Error('IPC failed'));

        await requestAccountInfo({ coin: 'btc', descriptor: 'xpub' });

        expect(TrezorConnect.uiResponse).toHaveBeenCalledWith({
            type: UI_RESPONSE.RECEIVE_DISCOVERY_ACCOUNT_INFO,
            payload: {
                success: false,
                error: { message: 'IPC failed', code: 'Failure_UnknownCode' },
            },
            requestId: REQUEST_ID,
        });
    });

    it('ignores the account info requests of other calls', async () => {
        await requestAccountInfo({ coin: 'btc', descriptor: 'xpub' }, 'other-call');

        expect(getAccountInfo).not.toHaveBeenCalled();
    });
});
