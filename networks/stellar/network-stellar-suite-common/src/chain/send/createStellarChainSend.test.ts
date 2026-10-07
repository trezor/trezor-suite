import type { DeviceUniquePath } from '@trezor/connect-common';
import type {
    ChainSendAccount,
    ChainSendDraft,
    PrecomposedTransactionFinal,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createStellarChainSend } from './createStellarChainSend';

const mockBuildSendTransaction = jest.fn();
const mockPrepareContractTokenTransfer = jest.fn();
const mockSerializeSignedTransaction = jest.fn();

jest.mock('@trezor/network-stellar/runtime', () => ({
    __esModule: true,
    default: () =>
        Promise.resolve({
            buildSendTransaction: (...args: unknown[]) => mockBuildSendTransaction(...args),
            prepareContractTokenTransfer: (...args: unknown[]) =>
                mockPrepareContractTokenTransfer(...args),
            serializeSignedTransaction: (...args: unknown[]) =>
                mockSerializeSignedTransaction(...args),
        }),
}));

const DESTINATION = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const ISSUER = 'GBDVX4VELCDSQ54KQJYTNHXAHFLBCA77ZY2USQBM4CSHTTV7DME7KALE';
const CONTRACT_TOKEN = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';

const connect = {
    getAccountInfo: jest.fn(),
    stellarSignTransaction: jest.fn(),
    pushTransaction: jest.fn(),
};
const getStellarBackendUrl = jest.fn();

const send = createStellarChainSend({
    getTrezorConnect: () => connect,
    getStellarBackendUrl,
    resolveStellarContractId: () => Promise.resolve(undefined),
})(asNetworkSymbol('xlm'));

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('xlm'),
    descriptor: 'GSENDER',
    index: 0,
    path: "m/44'/148'/0'",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '100000000',
    availableBalance: '90000000',
    formattedBalance: '10',
    misc: { stellarSequence: '42', reserve: '10000000', baseReserve: '5000000' },
};

const draft: ChainSendDraft = {
    outputs: [
        {
            type: 'payment',
            address: DESTINATION,
            amount: '5',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
        },
    ],
    feePerUnit: '',
    feeLimit: '',
    options: [],
    destinationTag: 'memo',
    isCoinControlEnabled: false,
    selectedUtxos: [],
};

const options = { device: { path: 'device' as DeviceUniquePath } };

const transaction = {
    toXdr: () => 'xdr',
    addSignature: jest.fn(),
    toEnvelope: () => ({ toXdr: () => 'envelope' }),
};

describe('createStellarChainSend', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockBuildSendTransaction.mockReturnValue(transaction);
        connect.stellarSignTransaction.mockResolvedValue({
            success: true,
            payload: { signature: 'ab' },
        });
    });

    it('signs a payment to an existing account at the next sequence, with the memo', async () => {
        connect.getAccountInfo.mockResolvedValue({ success: true, payload: { empty: false } });

        const signed = await send.sign({
            account,
            draft,
            precomposed: { feePerByte: '100' } as PrecomposedTransactionFinal,
            options,
        });

        expect(mockBuildSendTransaction).toHaveBeenCalledWith({
            descriptor: 'GSENDER',
            sequence: '42',
            fee: '100',
            destinationActivated: true,
            destination: DESTINATION,
            amount: '5',
            asset: { type: 0 },
            memo: 'memo',
            isTestnet: false,
        });
        expect(connect.stellarSignTransaction).toHaveBeenCalledWith({
            device: options.device,
            payment_req: undefined,
            path: account.path,
            xdrBase64: 'xdr',
            testnet: false,
        });
        expect(transaction.addSignature).toHaveBeenCalledWith('GSENDER', 'qw==');
        expect(signed).toEqual({ serializedTx: 'envelope' });
    });

    it('creates the recipient account when it does not exist and pays a classic asset by code', async () => {
        connect.getAccountInfo.mockResolvedValue({ success: true, payload: { empty: true } });

        await send.sign({
            account,
            draft,
            precomposed: {
                feePerByte: '100',
                token: { standard: 'STELLAR-CLASSIC', contract: `USDCX-${ISSUER}`, decimals: 7 },
            } as PrecomposedTransactionFinal,
            options,
        });

        expect(mockBuildSendTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                destinationActivated: false,
                asset: { type: 2, code: 'USDCX', issuer: ISSUER },
            }),
        );
    });

    it('prepares a Soroban transfer against the connected backend with the approved fee', async () => {
        getStellarBackendUrl.mockReturnValue('https://xlm.example');
        mockPrepareContractTokenTransfer.mockResolvedValue({ transaction });
        mockSerializeSignedTransaction.mockReturnValue('soroban-envelope');

        const signed = await send.sign({
            account,
            draft,
            precomposed: {
                feePerByte: '200',
                token: { standard: 'STELLAR-CONTRACT', contract: CONTRACT_TOKEN, decimals: 7 },
                outputs: [
                    { address: DESTINATION, amount: '50000000', script_type: 'PAYTOADDRESS' },
                ],
            } as unknown as PrecomposedTransactionFinal,
            options,
        });

        expect(getStellarBackendUrl).toHaveBeenCalledWith('xlm');
        expect(mockPrepareContractTokenTransfer).toHaveBeenCalledWith({
            backendUrl: 'https://xlm.example',
            descriptor: 'GSENDER',
            sequence: '42',
            inclusionFee: '200',
            contract: CONTRACT_TOKEN,
            destination: DESTINATION,
            amount: '50000000',
            isTestnet: false,
        });
        expect(mockSerializeSignedTransaction).toHaveBeenCalledWith(transaction, 'GSENDER', 'ab');
        expect(signed).toEqual({ serializedTx: 'soroban-envelope' });
    });

    it('does not ask the device to sign a Soroban transfer without a backend', async () => {
        getStellarBackendUrl.mockReturnValue(undefined);

        await expect(
            send.sign({
                account,
                draft,
                precomposed: {
                    token: { standard: 'STELLAR-CONTRACT', contract: CONTRACT_TOKEN, decimals: 7 },
                } as PrecomposedTransactionFinal,
                options,
            }),
        ).rejects.toMatchObject({
            code: 'sign-failed',
            message: 'Not connected to a Stellar backend.',
        });
        expect(connect.stellarSignTransaction).not.toHaveBeenCalled();
    });
});
