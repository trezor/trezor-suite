import type { DeviceUniquePath } from '@trezor/connect-common';
import {
    type ChainComposeContext,
    type ChainSendAccount,
    type ChainSendDraft,
    ChainSendError,
    type PrecomposedTransactionCardanoFinal,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createCardanoChainSend } from './createCardanoChainSend';

const connect = {
    cardanoComposeTransaction: jest.fn(),
    cardanoSignTransaction: jest.fn(),
    pushTransaction: jest.fn(),
};

const send = createCardanoChainSend({ getTrezorConnect: () => connect })(asNetworkSymbol('ada'));

const POLICY_ID = 'a'.repeat(56);
const changeAddress = {
    address: 'addr_change',
    path: "m/1852'/1815'/3'/1/0",
    transfers: 0,
    balance: '0',
    sent: '0',
    received: '0',
};

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('ada'),
    descriptor: 'cardano-xpub',
    index: 3,
    path: "m/1852'/1815'/3'",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '10000000',
    availableBalance: '10000000',
    formattedBalance: '10',
    utxo: [],
    addresses: { change: [changeAddress], used: [], unused: [] },
    tokens: [{ standard: 'BLOCKFROST', contract: POLICY_ID, decimals: 2, balance: '500' }],
};

const draft = (overrides: Partial<ChainSendDraft> = {}): ChainSendDraft => ({
    outputs: [
        {
            type: 'payment',
            address: 'addr_recipient',
            amount: '1.5',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
        },
    ],
    feePerUnit: '44',
    feeLimit: '',
    options: [],
    isCoinControlEnabled: false,
    selectedUtxos: [],
    ...overrides,
});

const context: ChainComposeContext = {
    feeInfo: {
        blockHeight: 1,
        blockTime: 20,
        minFee: 44,
        maxFee: 44,
        minPriorityFee: 0,
        levels: [{ label: 'normal', feePerUnit: '44', blocks: -1 }],
    },
};

describe('createCardanoChainSend', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('composes from the account UTXOs with change to its first unused change address', async () => {
        connect.cardanoComposeTransaction.mockResolvedValue({
            success: true,
            payload: [{ type: 'final', fee: '170000', totalSpent: '1670000', max: undefined }],
        });

        const levels = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(connect.cardanoComposeTransaction).toHaveBeenCalledWith({
            feeLevels: [{ label: 'normal', feePerUnit: '44', blocks: -1 }],
            outputs: [{ address: 'addr_recipient', amount: '1500000', assets: [], setMax: false }],
            account: { descriptor: 'cardano-xpub', utxo: [] },
            changeAddress,
            addressParameters: {
                path: changeAddress.path,
                addressType: 0,
                stakingPath: "m/1852'/1815'/3'/2/0",
            },
            testnet: false,
        });
        expect(levels).toEqual({
            normal: { type: 'final', fee: '170000', totalSpent: '1670000', max: undefined },
        });
    });

    it('adds the custom fee level and gives a sent-max token amount in its unit', async () => {
        connect.cardanoComposeTransaction.mockResolvedValue({
            success: true,
            payload: [
                { type: 'final', fee: '1', totalSpent: '1', max: '500' },
                { type: 'final', fee: '1', totalSpent: '1', max: '500' },
            ],
        });

        const levels = await send.composeFeeLevels({
            account,
            draft: draft({
                selectedFee: 'custom',
                feePerUnit: '50',
                setMaxOutputId: 0,
                outputs: [{ ...draft().outputs[0]!, token: POLICY_ID, amount: '' }],
            }),
            context,
        });

        expect(connect.cardanoComposeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                feeLevels: [
                    { label: 'normal', feePerUnit: '44', blocks: -1 },
                    { label: 'custom', feePerUnit: '50', blocks: -1 },
                ],
            }),
        );
        expect(levels.custom).toMatchObject({ max: '5' });
    });

    it('explains coin selection errors the user can fix and leaves the others to the app', async () => {
        connect.cardanoComposeTransaction.mockResolvedValue({
            success: true,
            payload: [{ type: 'error', error: 'UTXO_BALANCE_INSUFFICIENT' }],
        });
        const insufficient = await send.composeFeeLevels({ account, draft: draft(), context });

        connect.cardanoComposeTransaction.mockResolvedValue({
            success: true,
            payload: [{ type: 'error', error: 'UNEXPECTED' }],
        });
        const unexpected = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(insufficient.normal).toMatchObject({ errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' } });
        expect(unexpected.normal).not.toHaveProperty('errorMessage');
    });

    it('cannot compose without the account addresses', async () => {
        await expect(
            send.composeFeeLevels({
                account: { ...account, addresses: undefined },
                draft: draft(),
                context,
            }),
        ).rejects.toMatchObject({ code: 'compose-failed' });
        expect(connect.cardanoComposeTransaction).not.toHaveBeenCalled();
    });

    it('signs an ordinary transaction on mainnet', async () => {
        connect.cardanoSignTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: 'signed' },
        });
        const precomposed = {
            type: 'final',
            fee: '170000',
            ttl: 100,
            inputs: [],
            outputs: [],
            unsignedTx: { body: 'body', hash: 'hash' },
        } as unknown as PrecomposedTransactionCardanoFinal;

        const signed = await send.sign({
            account,
            draft: draft(),
            precomposed,
            options: {
                device: { path: 'device' as DeviceUniquePath },
                chunkify: true,
            },
        });

        expect(signed).toEqual({ serializedTx: 'signed' });
        expect(connect.cardanoSignTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                signingMode: 0,
                testnet: false,
                protocolMagic: 764824073,
                networkId: 1,
                fee: '170000',
                ttl: '100',
                derivationType: 1,
                chunkify: true,
                unsignedTx: { body: 'body', hash: 'hash' },
            }),
        );
    });

    it('refuses to sign a transaction coin selection did not build', async () => {
        const error = await send
            .sign({
                account,
                draft: draft(),
                precomposed: { type: 'final' } as unknown as PrecomposedTransactionCardanoFinal,
                options: { device: {} },
            })
            .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ChainSendError);
        expect(connect.cardanoSignTransaction).not.toHaveBeenCalled();
    });
});
