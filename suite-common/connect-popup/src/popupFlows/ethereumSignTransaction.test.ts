import {
    asNetworkSymbol,
    getNetwork,
    registerLegacyCustomEvmNetwork,
    unregisterLegacyNetwork,
} from '@suite-common/wallet-config';
import { sendFormActions } from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountToken } from '@suite-common/wallet-types/mocks';
import { getResolvedDisplayFormat } from '@suite-common/wallet-utils';
import TrezorConnect, { type EthereumDisplayFormat } from '@trezor/connect';

import { type PopupFlowPayload } from './CommonPopupFlow';
import { EthereumSignTransaction } from './ethereumSignTransaction';
import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import {
    CALL_SOURCE_DESKTOP_WS,
    type ConnectCallSource,
    UNKNOWN_PROCESS,
} from '../connectPopupTypes';

const TOKEN_CONTRACT = '0x128cC466B61f542da60c70e3aA11c10e19B84EDB';
const RECIPIENT = '0x000000000000000000000000000000000000abcd';
const TRANSFER_DATA = `0xa9059cbb${RECIPIENT.slice(2).padStart(64, '0')}${(1_500_000)
    .toString(16)
    .padStart(64, '0')}`;

const accountToken = mockAccountToken({ contract: TOKEN_CONTRACT.toLowerCase(), decimals: 6 });

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { ethereumGetAddress: jest.fn() },
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => ({ path: '1', instance: 0, useEmptyPassphrase: true }),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountForNetworkSymbolAndPath: () => ({ key: 'account-key', tokens: [accountToken] }),
}));

const mockedGetAddress = TrezorConnect.ethereumGetAddress as jest.Mock;

type RunPreCallParams = {
    payload: PopupFlowPayload<'ethereumSignTransaction'>;
    source: ConnectCallSource;
    dispatch: jest.Mock;
    txSigningPrecomposed?: PrecomposedTransactionFinal;
};

const runPreCall = ({ payload, source, dispatch, txSigningPrecomposed }: RunPreCallParams) => {
    const flow = new EthereumSignTransaction(
        { method: 'ethereumSignTransaction', payload, source },
        {
            dispatch,
            getState: () => ({}),
        },
    );

    return flow['preCall'](txSigningPrecomposed);
};

const runSimulationPreCall = (chainId: number) => {
    const dispatch = jest.fn(action => {
        // Stands in for the user confirming the simulation modal. Deferred to the next tick
        // because the flow creates the permission deferred right after this dispatch.
        if (connectPopupActions.txSimulation.match(action)) {
            setTimeout(() => getPermissionDeferred().resolve());
        }

        return action;
    });

    const run = runPreCall({
        payload: {
            path: "m/44'/60'/0'/0/0",
            transaction: {
                to: '0x0',
                value: '0x0',
                gasPrice: '0x1',
                gasLimit: '0x5208',
                nonce: '0x0',
                chainId,
            },
        },
        source: {
            type: 'walletconnect',
            origin: 'https://dapp.example',
            manifest: { appName: 'dapp' },
        },
        dispatch,
    });

    return { run, dispatch };
};

// The shape connect returns for a transfer of a token without a firmware definition.
const contractCallPrecomposedTx: PrecomposedTransactionFinal = {
    type: 'final',
    inputs: [],
    outputsPermutation: [0],
    outputs: [{ address: TOKEN_CONTRACT, amount: '0', script_type: 'PAYTOADDRESS' }],
    totalSpent: '42000',
    fee: '42000',
    feePerByte: '20',
    bytes: 0,
    max: undefined,
    isTokenKnown: false,
};

type RunContractCallPreCallParams = {
    to: string;
    value?: string;
    data: string;
    chainId: number;
    txSigningPrecomposed: PrecomposedTransactionFinal;
};

const runContractCallPreCall = async ({
    to,
    value = '0x0',
    data,
    chainId,
    txSigningPrecomposed,
}: RunContractCallPreCallParams) => {
    const dispatch = jest.fn(action => action);

    await runPreCall({
        payload: {
            path: "m/44'/60'/0'/0/0",
            transaction: {
                to,
                value,
                data,
                gasPrice: '0x1',
                gasLimit: '0xa410',
                nonce: '0x5',
                chainId,
            },
        },
        source: {
            type: CALL_SOURCE_DESKTOP_WS,
            origin: 'https://app.example',
            process: UNKNOWN_PROCESS,
            manifest: { appName: 'app' },
        },
        dispatch,
        txSigningPrecomposed,
    });

    return dispatch.mock.calls
        .map(([action]) => action)
        .find(sendFormActions.storePrecomposedTransaction.match);
};

describe('EthereumSignTransaction.preCall', () => {
    beforeEach(() => {
        mockedGetAddress.mockResolvedValue({ success: true, payload: { address: '0xabc' } });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('opens the simulation modal for a chain Blockaid can scan', async () => {
        const { run, dispatch } = runSimulationPreCall(getNetwork('eth').chainId);
        await run;

        expect(dispatch).toHaveBeenCalledWith(
            connectPopupActions.txSimulation({ fromAddress: '0xabc' }),
        );
    });

    it.each([
        ['Arc', getNetwork('arc').chainId],
        ['Arc Testnet', getNetwork('tarc').chainId],
        ['Ethereum Classic', getNetwork('etc').chainId],
        // The flow falls back to mainnet for account selection, but the simulation reads chainId 0.
        ['chainId 0', 0],
    ])('skips the simulation modal on %s, which Blockaid cannot scan', async (_name, chainId) => {
        const { run, dispatch } = runSimulationPreCall(chainId);
        await run;

        expect(mockedGetAddress).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: connectPopupActions.txSimulation.type }),
        );
    });

    describe('on a user-added network', () => {
        const symbol = asNetworkSymbol('evm100');
        const registerGnosis = () =>
            registerLegacyCustomEvmNetwork({
                symbol,
                chainId: 100,
                name: 'Gnosis',
                displaySymbol: 'XDAI',
                explorerUrl: 'https://gnosisscan.io',
                testnet: false,
            });

        afterEach(() => {
            unregisterLegacyNetwork(symbol);
        });

        it('opens the simulation modal while the network is registered', async () => {
            registerGnosis();

            const { run, dispatch } = runSimulationPreCall(100);
            await run;

            expect(dispatch).toHaveBeenCalledWith(
                connectPopupActions.txSimulation({ fromAddress: '0xabc' }),
            );
        });

        it('skips the simulation modal for the same chain when it is not registered', async () => {
            const { run, dispatch } = runSimulationPreCall(100);
            await run;

            expect(dispatch).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: connectPopupActions.txSimulation.type }),
            );
        });
    });

    it('stores a token transfer connect could not decode with the account token', async () => {
        const storeAction = await runContractCallPreCall({
            to: TOKEN_CONTRACT,
            data: TRANSFER_DATA,
            chainId: getNetwork('arc').chainId,
            txSigningPrecomposed: contractCallPrecomposedTx,
        });

        expect(storeAction?.payload.precomposedTransaction).toMatchObject({
            outputs: [{ address: RECIPIENT, amount: '1500000' }],
            token: accountToken,
            isTokenKnown: false,
        });
        expect(storeAction?.payload.formState).toMatchObject({
            transactionData: TRANSFER_DATA.slice(2),
            ethereumNonce: '5',
        });
    });

    it('stores the display format connect found, for the review to show the decoded call', async () => {
        const gateway = '0x721b9abab6511b46b9ee83a1aba23bdacb004149';
        const signer = '0x000000000000000000000000000000000000abcd';
        const depositEthData = `0x474cf53d${[gateway, signer, '0x0']
            .map(word => word.slice(2).padStart(64, '0'))
            .join('')}`;
        const displayFormat: EthereumDisplayFormat = {
            chainId: getNetwork('arc').chainId,
            address: gateway,
            functionSignature: '0x474cf53d',
            intent: 'Supply',
            providerName: 'Aave',
            parameters: [
                { type: 'atomic', abiType: 'ABI_ADDRESS' },
                { type: 'atomic', abiType: 'ABI_ADDRESS' },
                { type: 'atomic', abiType: 'ABI_UINT16' },
            ],
            fields: [
                {
                    label: 'Amount to supply',
                    formatter: 'FORMATTER_AMOUNT',
                    path: { type: 'container', container: 'VALUE' },
                    nativeCurrencyAddresses: [],
                    enumValues: [],
                },
                {
                    label: 'Collateral recipient',
                    formatter: 'FORMATTER_ADDRESS_NAME',
                    path: { type: 'data', steps: [1] },
                    nativeCurrencyAddresses: [],
                    enumValues: [],
                },
            ],
        };

        // Shaped as connect's `__info` preview of the call.
        const storeAction = await runContractCallPreCall({
            to: gateway,
            value: '0xde0b6b3a7640000',
            data: depositEthData,
            chainId: getNetwork('arc').chainId,
            txSigningPrecomposed: {
                ...contractCallPrecomposedTx,
                outputs: [
                    {
                        address: gateway,
                        amount: '1000000000000000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                displayFormat,
            },
        });

        expect(
            storeAction &&
                getResolvedDisplayFormat({
                    account: { networkType: 'ethereum', descriptor: asAccountDescriptor(signer) },
                    precomposedTx: storeAction.payload.precomposedTransaction,
                    transactionData: storeAction.payload.formState.transactionData,
                }),
        ).toMatchObject({
            providerName: 'Aave',
            intent: 'Supply',
            rows: [
                { values: [{ type: 'nativeAmount', amount: '1000000000000000000' }] },
                {
                    values: [
                        { type: 'address', address: '0x000000000000000000000000000000000000ABcD' },
                    ],
                },
            ],
        });
    });
});
