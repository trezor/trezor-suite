import {
    type GetNetworkDeps,
    createGetNetwork,
    createNetworkFamiliesCompositionRoot,
} from '@suite-common/networks';
import type { Transaction } from '@trezor/blockchain-link-types';
import { asGetter, createMockDeps } from '@trezor/dependency-injection';
import type {
    BackendType,
    Label,
    NetworkSuiteCommonModuleApi,
    OpenAccount,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { messages } from '../messages';
import { isTranslationKey } from '../types';

const address = (path: string) => ({ path, address: path });

const createAccount = (symbol: string): OpenAccount => ({
    symbol: asNetworkSymbol(symbol),
    accountType: 'normal',
    index: 0,
    path: "m/0'/0'/0'",
    descriptor: 'descriptor',
    addresses: { unused: [address('m/0/2')], used: [address('m/0/1')], change: [address('m/1/0')] },
    misc: { staking: { address: 'stake' } },
});

// A transaction carrying every network-specific field the families read, so each states all it can.
const transaction: Transaction = {
    type: 'sent',
    txid: 'txid',
    amount: '1',
    fee: '1',
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: { vin: [], vout: [], size: 1, totalInput: '0', totalOutput: '0' },
    ethereumSpecific: {
        status: 1,
        nonce: 1,
        gasLimit: 2,
        gasUsed: 1,
        maxFeePerGas: '1',
    },
    rippleSpecific: { destinationTag: 1 },
    stellarSpecific: { memo: 'memo', feeSource: 'source' },
    solanaSpecific: { status: 'confirmed', memo: 'memo' },
    tronSpecific: { energyUsage: '1', bandwidthUsage: '1', note: 'note' },
};

const createGetNetworkForBackend = (backend: BackendType) =>
    createGetNetwork({
        networkFamilies: createNetworkFamiliesCompositionRoot(
            createMockDeps<NetworkSuiteCommonModuleApi>({ getTrezorConnect: null }),
        ),
        getNetworkBackend: asGetter(() => backend),
    } satisfies GetNetworkDeps);

// Every message signing label the families hand to the UI, gathered the way the page reads them.
const getMessageSigningLabels = (): Label[] => {
    const getNetwork = createGetNetworkForBackend('blockbook');

    return ['btc', 'eth', 'ada'].flatMap(symbol => {
        const account = createAccount(symbol);
        const messageSigning = getNetwork({ symbol: account.symbol })?.capabilities.messageSigning;

        if (messageSigning === undefined) {
            throw new Error(`${symbol} is expected to sign messages.`);
        }

        const choices = messageSigning.getChoices(account);
        const groups = messageSigning.getSignAddressGroups({ account, touchedAddresses: [] });

        return [
            messageSigning.labels.title,
            ...choices.flatMap(choice => [
                choice.label,
                ...choice.options.map(option => option.label),
                ...(choice.tooltip ? [choice.tooltip] : []),
            ]),
            ...groups.flatMap(group => (group.label ? [group.label] : [])),
        ];
    });
};

// Every transaction fact label, for each backend that has its own transaction details.
const getTransactionFactLabels = (): Label[] =>
    (
        [
            ['btc', 'blockbook'],
            ['btc', 'electrum'],
            ['eth', 'blockbook'],
            ['eth', 'evm-rpc'],
            ['xrp', 'ripple'],
            ['xlm', 'stellar'],
            ['sol', 'solana'],
            ['trx', 'blockbook'],
        ] as const
    ).flatMap(([symbol, backend]) => {
        const transactionDetails = createGetNetworkForBackend(backend)({
            symbol: asNetworkSymbol(symbol),
        })?.capabilities.transactionDetails;

        if (transactionDetails === undefined) {
            throw new Error(`${symbol} on ${backend} is expected to describe transactions.`);
        }

        return transactionDetails
            .getFacts({ transaction, isConfirmed: true })
            .map(fact => fact.label);
    });

describe('capability labels', () => {
    it.each([...getMessageSigningLabels(), ...getTransactionFactLabels()])(
        '$id is in the desktop catalog as the family wrote it',
        label => {
            expect(isTranslationKey(label.id)).toBe(true);
            expect(isTranslationKey(label.id) && messages[label.id].defaultMessage).toBe(
                label.defaultMessage,
            );
        },
    );
});
