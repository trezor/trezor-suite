import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { CoinSymbolParam } from '../coinInfo';
import type { Params, Response } from '../params';

// Account derivation variant. Mirrors the `type` values in `ACCOUNT_TYPES`
// (see discoverAccounts.ts). For account-based networks (EVM) the relevant
// variants are 'normal' | 'ledger' | 'legacy'; bitcoin-likes add 'taproot' | 'segwit'.
export type AccountType = Static<typeof AccountType>;
export const AccountType = Type.Union([
    Type.Literal('normal'),
    Type.Literal('taproot'),
    Type.Literal('segwit'),
    Type.Literal('legacy'),
    Type.Literal('ledger'),
]);

// A derivation path template not covered by the network's built-in account types (see
// networksConfig `AccountType`), identified in the UI by `label` instead of a translated name.
// `bip43Path` uses `i` as a placeholder for the account index (e.g. `m/44'/60'/i'/0/0`) — the same
// template format as `NetworkAccount.bip43Path` in `@suite-common/wallet-config`.
export type CustomAccountType = Static<typeof CustomAccountType>;
export const CustomAccountType = Type.Object({
    bip43Path: Type.String(),
    label: Type.String(),
});

// Bounds for a 'multi'-style selection: whole numbers ≥ 1 (minCount defaults to 1, maxCount to
// unbounded, so `{}` ≡ multi). Cross-field `minCount <= maxCount` is enforced in the constructor.
export type MultiSelectBounds = Static<typeof MultiSelectBounds>;
export const MultiSelectBounds = Type.Object({
    minCount: Type.Optional(Type.Integer({ minimum: 1 })),
    maxCount: Type.Optional(Type.Integer({ minimum: 1 })),
});

export type SelectionType = Static<typeof SelectionType>;
export const SelectionType = Type.Union([
    // One account (e.g. an exchange). Default.
    Type.Literal('single'),
    // Several accounts, unbounded.
    Type.Literal('multi'),
    // Several accounts, bounded by minCount/maxCount.
    MultiSelectBounds,
]);

// UTXO-only sharing flow (see the `addressSelection` field on SelectAccount for the full
// semantics). 'fullAccount' shares the whole account as an xpub; 'firstFresh' | 'manual' export
// only an individual address.
export type AddressSelection = Static<typeof AddressSelection>;
export const AddressSelection = Type.Union([
    Type.Literal('fullAccount'),
    Type.Literal('firstFresh'),
    Type.Literal('manual'),
]);

export type SelectAccount = Static<typeof SelectAccount>;
export const SelectAccount = Type.Object({
    // Network to select an account for, e.g. 'eth' | 'btc' | 'ada'.
    coin: CoinSymbolParam(),
    selectionType: Type.Optional(SelectionType),
    // Allowed account types, each shown as its own tab in the picker. Entries are either one of
    // the network's built-in types, or a custom derivation path with its own label. If omitted,
    // all of the network's publicly available types are allowed.
    accountType: Type.Optional(Type.Array(Type.Union([AccountType, CustomAccountType]))),
    // UTXO-only; ignored for account-based networks (EVM, Solana, …), which always export an
    // individual address. Controls which of two separate flows a UTXO account is shared through:
    // - 'fullAccount' (default when omitted): the whole account is shared as an xpub, like a
    //   watch-only wallet import. No individual address is picked or verified as part of this
    //   call. Requires `read_xpub`.
    // - 'firstFresh' | 'manual': only the individual address(es) the user picks are exported —
    //   'firstFresh' auto-selects the next unused receive address, 'manual' lets the user pick a
    //   used one. The xpub is never exported here; requires the narrower `read_address` instead.
    addressSelection: Type.Optional(AddressSelection),
    // Require the selected address(es) to be confirmed on the device. Default true.
    requireOnDeviceVerification: Type.Optional(Type.Boolean()),
});

export type SelectedAccount = Static<typeof SelectedAccount>;
export const SelectedAccount = Type.Object({
    // Network symbol, e.g. 'eth'.
    symbol: Type.String(),
    // Serialized derivation path of the selected account (and, for the address-selection flow, the
    // selected address within it).
    path: Type.String(),
    // The selected address (checksummed for EVM). Set for account-based networks, and for UTXO
    // accounts selected via `addressSelection: 'firstFresh' | 'manual'`. Mutually exclusive with
    // `xpub`.
    address: Type.Optional(Type.String()),
    // The account's extended public key. Set only for UTXO accounts shared via
    // `addressSelection: 'fullAccount'` (or omitted) — mutually exclusive with `address`.
    xpub: Type.Optional(Type.String()),
    accountType: Type.Optional(AccountType),
    // SLIP-0019 address MAC from the on-device verification, when available. Only applies to the
    // `address` case — lets the integrator later re-prove the address belongs to the device
    // without an xpub.
    mac: Type.Optional(Type.String()),
});

// Always returns an array, even for a 'single' selection — mirrors eth_requestAccounts, and keeps
// the response shape independent of what selectionType numerically resolves to.
export declare function selectAccount(params: Params<SelectAccount>): Response<SelectedAccount[]>;
