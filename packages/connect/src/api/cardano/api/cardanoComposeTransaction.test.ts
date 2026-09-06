import { MessagesSchema as PROTO } from '@trezor/protobuf';

const coinSelection = jest.fn();

jest.mock('@trezor/network-cardano/runtime', () => ({
    __esModule: true,
    default: () =>
        Promise.resolve({
            coinSelection,
            asCoinSelectionError: () => undefined,
            trezorUtils: {
                transformToTrezorInputs: () => [],
                transformToTrezorOutputs: () => [],
            },
        }),
}));

jest.mock('../cardanoUtils', () => ({ getCoinSelectionParams: () => ({}) }));

// eslint-disable-next-line import/first -- the mocks above must be registered before the subject
import CardanoComposeTransaction from './cardanoComposeTransaction';

const PARAMS = {
    method: 'cardanoComposeTransaction',
    account: { descriptor: 'stake_test_descriptor', utxo: [] },
    changeAddress: { address: 'addr_change', path: "m/1852'/1815'/0'/1/0" },
    addressParameters: {
        addressType: PROTO.CardanoAddressType.BASE,
        path: "m/1852'/1815'/0'/0/0",
    },
};

const compose = (params: Record<string, unknown>) =>
    new CardanoComposeTransaction({ payload: { ...PARAMS, ...params } } as any).run();

describe('CardanoComposeTransaction protocol parameter drift', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    beforeEach(() => {
        warn.mockClear();
        coinSelection.mockReturnValue({
            type: 'nonfinal',
            fee: '1',
            deposit: '0',
            totalSpent: '1',
            max: undefined,
        });
    });

    it('warns when a live fee level disagrees with the compiled-in minFeeA', async () => {
        await compose({ feeLevels: [{ feePerUnit: '99' }] });

        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('protocol parameters differ from the compiled-in defaults'),
            [{ param: 'minFeeA', live: '99', compiled: '44' }],
        );
    });

    it('reports every supplied parameter that drifts, not just minFeeA', async () => {
        await compose({ protocolParams: { keyDeposit: '3000000', maxTxSize: 32768 } });

        expect(warn).toHaveBeenCalledWith(expect.any(String), [
            { param: 'keyDeposit', live: '3000000', compiled: '2000000' },
            { param: 'maxTxSize', live: 32768, compiled: 16384 },
        ]);
    });

    it('stays silent when the live values match the compiled-in defaults', async () => {
        await compose({ feeLevels: [{ feePerUnit: '44' }], protocolParams: { minFeeB: '155381' } });

        expect(warn).not.toHaveBeenCalled();
    });

    it('warns once per request rather than once per fee level', async () => {
        await compose({ feeLevels: [{ feePerUnit: '99' }, { feePerUnit: '99' }] });

        expect(warn).toHaveBeenCalledTimes(1);
    });
});
