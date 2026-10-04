import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Network } from '@trezor/utxo-lib';

import {
    BITCOIN_NATIVE_SEGWIT_NETWORK,
    BITCOIN_NETWORK,
    BITCOIN_P2SH_SEGWIT_NETWORK,
} from './bitcoinNetwork';

/** Account types the migration handles. The names match the payment types of @trezor/utxo-lib. */
export type AccountType = 'p2pkh' | 'p2sh' | 'p2wpkh';

type AccountTypeDefinition = {
    purpose: number;
    label: string;
    addressHint: string;
    inputScriptType: PROTO.InternalInputScriptType;
    /** Network whose extended-key prefix tells blockbook how to derive the account addresses. */
    descriptorNetwork: Network;
};

export const ACCOUNT_TYPE_DEFINITIONS: Record<AccountType, AccountTypeDefinition> = {
    p2pkh: {
        purpose: 44,
        label: 'Legacy',
        addressHint: 'addresses starting with 1',
        inputScriptType: 'SPENDADDRESS',
        descriptorNetwork: BITCOIN_NETWORK,
    },
    p2sh: {
        purpose: 49,
        label: 'Legacy SegWit',
        addressHint: 'addresses starting with 3',
        inputScriptType: 'SPENDP2SHWITNESS',
        descriptorNetwork: BITCOIN_P2SH_SEGWIT_NETWORK,
    },
    p2wpkh: {
        purpose: 84,
        label: 'SegWit',
        addressHint: 'addresses starting with bc1q',
        inputScriptType: 'SPENDWITNESS',
        descriptorNetwork: BITCOIN_NATIVE_SEGWIT_NETWORK,
    },
};

const HARDENED = 0x80000000;

const BITCOIN_SLIP44 = 0;

const toHardened = (index: number) => (index | HARDENED) >>> 0;

export const isHardened = (index: number) => index >= HARDENED;

/** BIP44-style account path `m / purpose' / 0' / account'`. */
export const getAccountPath = (accountType: AccountType, accountIndex: number): number[] => [
    toHardened(ACCOUNT_TYPE_DEFINITIONS[accountType].purpose),
    toHardened(BITCOIN_SLIP44),
    toHardened(accountIndex),
];

export const formatPath = (path: number[]) =>
    `m/${path.map(part => (isHardened(part) ? `${part - HARDENED}'` : `${part}`)).join('/')}`;
