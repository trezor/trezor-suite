import cardano from '@trezor/network-cardano/runtime';

import CardanoComposeTransaction from './cardanoComposeTransaction';
import { getCardanoProtocolParams } from '../cardanoProtocolParams';

jest.mock('@trezor/schema-utils', () => {
    const actual = jest.requireActual('@trezor/schema-utils');

    return {
        ...actual,
        Assert: jest.fn(),
    };
});

jest.mock('@trezor/network-cardano/runtime', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../cardanoProtocolParams', () => ({
    getCardanoProtocolParams: jest.fn(),
}));

const DEFAULT_PROTOCOL_PARAMS = {
    minFeeA: '44',
    minFeeB: '155381',
    keyDeposit: '2000000',
    poolDeposit: '500000000',
    coinsPerUtxoByte: '4310',
    maxValueSize: 5000,
    maxTxSize: 16384,
};

const liveProtocolParams = { ...DEFAULT_PROTOCOL_PARAMS, keyDeposit: '3000000' };

const payload = {
    method: 'cardanoComposeTransaction',
    account: { descriptor: 'xpub', utxo: [] },
    changeAddress: { address: 'addr1change', path: "m/1852'/1815'/0'/1/0" },
    addressParameters: { addressType: 0, path: "m/1852'/1815'/0'/1/0" },
    outputs: [{ address: 'addr1recipient', amount: '1000000', assets: [] }],
};

const coinSelection = jest.fn();
const sendCoreMessage = jest.fn();

const createMethod = (params: Record<string, unknown> = {}) =>
    new CardanoComposeTransaction({ payload: { ...payload, ...params } } as any);

describe('cardanoComposeTransaction', () => {
    beforeEach(() => {
        jest.mocked(cardano).mockResolvedValue({
            coinSelection,
            trezorUtils: {},
            asCoinSelectionError: () => undefined,
            DEFAULT_PROTOCOL_PARAMS,
        } as any);
        jest.mocked(getCardanoProtocolParams).mockResolvedValue(liveProtocolParams);
        coinSelection.mockReturnValue({
            type: 'nonfinal',
            fee: '170000',
            totalSpent: '4170000',
            deposit: '3000000',
            withdrawal: '0',
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('composes with live protocol params for every fee level', async () => {
        const result = await createMethod({
            feeLevels: [{ feePerUnit: '44' }, {}],
        }).run({ sendCoreMessage } as any);

        expect(getCardanoProtocolParams).toHaveBeenCalledTimes(1);
        expect(getCardanoProtocolParams).toHaveBeenCalledWith({
            testnet: false,
            postMessage: sendCoreMessage,
            defaults: DEFAULT_PROTOCOL_PARAMS,
        });
        expect(coinSelection).toHaveBeenCalledTimes(2);
        expect(coinSelection).toHaveBeenNthCalledWith(1, expect.anything(), {
            feeParams: { a: '44' },
            protocolParams: liveProtocolParams,
        });
        expect(coinSelection).toHaveBeenNthCalledWith(2, expect.anything(), {
            feeParams: undefined,
            protocolParams: liveProtocolParams,
        });
        expect(result).toEqual([
            expect.objectContaining({ type: 'nonfinal', deposit: '3000000', feePerByte: '44' }),
            expect.objectContaining({ type: 'nonfinal', deposit: '3000000', feePerByte: '0' }),
        ]);
    });

    it('requests testnet protocol params for testnet accounts', async () => {
        await createMethod({ testnet: true }).run({ sendCoreMessage } as any);

        expect(getCardanoProtocolParams).toHaveBeenCalledWith(
            expect.objectContaining({ testnet: true }),
        );
    });
});
