import { type ComposeOutput, type GetTrezorConnectDep, asCoinSymbol } from '@trezor/connect-common';
import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin/constants';
import type {
    WalletConnectAccount,
    WalletConnectAdapter,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';

import { getNetworkConfig } from '../networkConfig';

export type BitcoinWalletConnectAdapterDeps = GetTrezorConnectDep<
    'blockchainEstimateFee' | 'composeTransaction' | 'pushTransaction'
>;

export type BitcoinWalletConnectAdapter = WalletConnectAdapter<BitcoinNetworkSymbol>;

type BitcoinAccount = WalletConnectAccount<BitcoinNetworkSymbol>;

type BitcoinContext = WalletConnectRequestContext<BitcoinNetworkSymbol>;

type GetAccountAddressesParams = { account: string };

type SignMessageParams = { account: string; message: string; address?: string };

type SendTransferParams = {
    account: string;
    recipientAddress: string;
    amount: string;
    changeAddress?: string;
    memo?: string;
};

type BitcoinAccountAddress = { address: string; publicKey: string; path: string };

const methods = [
    'sendTransfer',
    'signMessage',
    'getAccountAddresses',
    // 'signPsbt' is not supported currently
];

const getAllAddresses = (account: BitcoinAccount) =>
    account.addresses
        ? [...account.addresses.used, ...account.addresses.change, ...account.addresses.unused]
        : [];

// The dApp names an account by its first receive address.
const findAccount = (accounts: readonly BitcoinAccount[], firstAddress: string) =>
    accounts.find(account => {
        const usedAddresses = account.addresses?.used.map(a => a.address) ?? [];
        const unusedAddresses = account.addresses?.unused.map(a => a.address) ?? [];

        return usedAddresses.includes(firstAddress) || unusedAddresses.includes(firstAddress);
    });

const getAccountAddress = (account: BitcoinAccount) =>
    account.addresses &&
    [...account.addresses.used, ...account.addresses.unused].find(a => a.path.endsWith('/0/0'))
        ?.address;

const getAccountAddresses = (context: BitcoinContext): BitcoinAccountAddress[] | undefined => {
    const { account: firstAddress } = context.request.params as GetAccountAddressesParams;
    const account = findAccount(context.accounts, firstAddress);
    if (!account?.addresses) return;

    return getAllAddresses(account).map(a => ({
        address: a.address,
        publicKey: account.descriptor,
        path: account.path,
    }));
};

const signMessage = async (context: BitcoinContext) => {
    const { account: firstAddress, message, address } = context.request.params as SignMessageParams;
    const account = findAccount(context.accounts, firstAddress);
    if (!account?.addresses) throw new Error('Account not found or addresses not loaded');

    const addressInfo = getAllAddresses(account).find(a => a.address === address || !address);
    if (!addressInfo) throw new Error('Address not found');

    const response = await context.callDevice('signMessage', {
        path: addressInfo.path,
        coin: asCoinSymbol(account.symbol),
        message,
        hex: true,
    });
    if (!response.success) {
        console.error('signMessage error', response);
        throw new Error('signMessage error');
    }

    return { signature: response.payload.signature, address: response.payload.address };
};

type SendTransferDeps = BitcoinWalletConnectAdapterDeps;

type SendTransfer = (context: BitcoinContext) => Promise<{ txid: string }>;

const createSendTransfer =
    (deps: SendTransferDeps): SendTransfer =>
    async context => {
        const {
            account: firstAddress,
            recipientAddress,
            amount,
            changeAddress,
            memo,
        } = context.request.params as SendTransferParams;
        const account = findAccount(context.accounts, firstAddress);
        if (!account) throw new Error('Account not found');
        if (!account.addresses || !account.utxo) throw new Error('Account is not loaded');

        const outputs: ComposeOutput[] = [{ type: 'payment', address: recipientAddress, amount }];
        if (memo) {
            outputs.push({ type: 'opreturn', dataHex: memo });
        }
        if (changeAddress) {
            outputs.push({ type: 'send-max', address: changeAddress });
        }

        const feeLevels = await deps.getTrezorConnect().blockchainEstimateFee({
            coin: asCoinSymbol(account.symbol),
            identity: account.identity,
            request: { blocks: [1] },
        });
        if (!feeLevels.success) {
            console.error('blockchainEstimateFee error', feeLevels);
            throw new Error('blockchainEstimateFee error');
        }

        const precomposedTransaction = await deps.getTrezorConnect().composeTransaction({
            outputs,
            coin: asCoinSymbol(account.symbol),
            account: {
                path: account.path,
                addresses: account.addresses,
                utxo: account.utxo,
            },
            feeLevels: feeLevels.payload.levels,
        });
        if (!precomposedTransaction.success) {
            console.error('composeTransaction error', precomposedTransaction);
            throw new Error('composeTransaction error');
        }

        const [firstResult] = precomposedTransaction.payload;
        if (firstResult?.type !== 'final') {
            console.error('composeTransaction error', precomposedTransaction);
            throw new Error('composeTransaction error');
        }

        const signResponse = await context.callDevice('signTransaction', {
            inputs: firstResult.inputs,
            outputs: firstResult.outputs,
            account: { addresses: account.addresses },
            coin: asCoinSymbol(account.symbol),
            chunkify: true,
            unlockPath: account.unlockPath,
            version: 2,
        });
        if (!signResponse.success) {
            console.error('signTransaction error', signResponse);
            throw new Error('signTransaction error');
        }

        const pushResponse = await deps.getTrezorConnect().pushTransaction({
            coin: asCoinSymbol(account.symbol),
            identity: account.identity,
            tx: signResponse.payload.serializedTx,
        });
        if (!pushResponse.success) {
            console.error('sendTransfer push error', pushResponse);
            throw new Error('sendTransfer push error');
        }

        return { txid: pushResponse.payload.txid };
    };

export const createBitcoinWalletConnectAdapter = (
    deps: BitcoinWalletConnectAdapterDeps,
): BitcoinWalletConnectAdapter => {
    const sendTransfer = createSendTransfer(deps);

    return {
        namespaceId: 'bip122',
        methods,
        events: ['accountsChanged'],
        getChainIds: symbol => {
            const { caipId } = getNetworkConfig(symbol);

            return caipId ? [caipId] : [];
        },
        getAccountAddress,
        handleRequest: async context => {
            switch (context.request.method) {
                case 'getAccountAddresses':
                    return getAccountAddresses(context);
                case 'signMessage':
                    return await signMessage(context);
                case 'sendTransfer':
                    return await sendTransfer(context);
                default:
                    throw new Error(`Unsupported method: ${context.request.method}`);
            }
        },
    };
};
