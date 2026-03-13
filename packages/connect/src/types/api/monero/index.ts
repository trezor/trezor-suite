import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { PROTO } from '../../../constants';
import type { Address as AddressShared } from '../../params';
import { DerivationPath } from '../../params';

export type MoneroNetworkType = PROTO.MoneroNetworkType;

// moneroGetAddress

export type MoneroGetAddress = Static<typeof MoneroGetAddress>;
export const MoneroGetAddress = Type.Object(
    {
        path: DerivationPath,
        address: Type.Optional(Type.String()),
        showOnTrezor: Type.Optional(Type.Boolean()),
        networkType: Type.Optional(PROTO.EnumMoneroNetworkType),
        account: Type.Optional(Type.Number()),
        minor: Type.Optional(Type.Number()),
        paymentId: Type.Optional(Type.String()),
        chunkify: Type.Optional(Type.Boolean()),
    },
    {
        $id: 'MoneroGetAddress',
    },
);

export type MoneroAddress = AddressShared;

// moneroGetWatchKey

export type MoneroGetWatchKey = Static<typeof MoneroGetWatchKey>;
export const MoneroGetWatchKey = Type.Object(
    {
        path: DerivationPath,
        networkType: Type.Optional(PROTO.EnumMoneroNetworkType),
    },
    {
        $id: 'MoneroGetWatchKey',
    },
);

export type MoneroWatchKey = Static<typeof MoneroWatchKey>;
export const MoneroWatchKey = Type.Object(
    {
        watch_key: Type.String(),
        address: Type.String(),
    },
    {
        $id: 'MoneroWatchKey',
    },
);

// moneroKeyImageSync

export type MoneroTransferDetails = Static<typeof MoneroTransferDetails>;
export const MoneroTransferDetails = Type.Object(
    {
        out_key: Type.String(),
        tx_pub_key: Type.String(),
        additional_tx_pub_keys: Type.Optional(
            Type.Union([Type.Array(Type.String()), Type.String()]),
        ),
        internal_output_index: Type.Number(),
        sub_addr_major: Type.Optional(Type.Number()),
        sub_addr_minor: Type.Optional(Type.Number()),
    },
    {
        $id: 'MoneroTransferDetails',
    },
);

export type MoneroSubAddressIndicesList = Static<typeof MoneroSubAddressIndicesList>;
export const MoneroSubAddressIndicesList = Type.Object(
    {
        account: Type.Number(),
        minor_indices: Type.Array(Type.Number()),
    },
    {
        $id: 'MoneroSubAddressIndicesList',
    },
);

export type MoneroKeyImageSync = Static<typeof MoneroKeyImageSync>;
export const MoneroKeyImageSync = Type.Object(
    {
        path: DerivationPath,
        networkType: Type.Optional(PROTO.EnumMoneroNetworkType),
        subs: Type.Optional(Type.Array(MoneroSubAddressIndicesList)),
        tdis: Type.Array(MoneroTransferDetails),
    },
    {
        $id: 'MoneroKeyImageSync',
    },
);

export type MoneroExportedKeyImage = Static<typeof MoneroExportedKeyImage>;
export const MoneroExportedKeyImage = Type.Object(
    {
        iv: Type.String(),
        key_image: Type.String(),
    },
    {
        $id: 'MoneroExportedKeyImage',
    },
);

export type MoneroKeyImageSyncResult = Static<typeof MoneroKeyImageSyncResult>;
export const MoneroKeyImageSyncResult = Type.Object(
    {
        key_images: Type.Array(MoneroExportedKeyImage),
        signature: Type.String(),
    },
    {
        $id: 'MoneroKeyImageSyncResult',
    },
);

// moneroSignTransaction

export type MoneroOutputEntry = Static<typeof MoneroOutputEntry>;
export const MoneroOutputEntry = Type.Object(
    {
        idx: Type.Number(),
        key: Type.Object({
            dest: Type.String(),
            commitment: Type.String(),
        }),
    },
    {
        $id: 'MoneroOutputEntry',
    },
);

export type MoneroMultisigKLRki = Static<typeof MoneroMultisigKLRki>;
export const MoneroMultisigKLRki = Type.Object(
    {
        K: Type.Optional(Type.String()),
        L: Type.Optional(Type.String()),
        R: Type.Optional(Type.String()),
        ki: Type.Optional(Type.String()),
    },
    {
        $id: 'MoneroMultisigKLRki',
    },
);

export type MoneroTransactionSourceEntry = Static<typeof MoneroTransactionSourceEntry>;
export const MoneroTransactionSourceEntry = Type.Object(
    {
        outputs: Type.Array(MoneroOutputEntry),
        real_output: Type.Number(),
        real_out_tx_key: Type.String(),
        real_out_additional_tx_keys: Type.Array(Type.String()),
        real_output_in_tx_index: Type.Number(),
        amount: Type.Number(),
        rct: Type.Boolean(),
        mask: Type.String(),
        subaddr_minor: Type.Number(),
        multisig_kLRki: Type.Optional(MoneroMultisigKLRki),
    },
    {
        $id: 'MoneroTransactionSourceEntry',
    },
);

export type MoneroAccountPublicAddress = Static<typeof MoneroAccountPublicAddress>;
export const MoneroAccountPublicAddress = Type.Object({
    spend_public_key: Type.String(),
    view_public_key: Type.String(),
});

export type MoneroTransactionDestinationEntry = Static<typeof MoneroTransactionDestinationEntry>;
export const MoneroTransactionDestinationEntry = Type.Object(
    {
        amount: Type.Number(),
        addr: MoneroAccountPublicAddress,
        is_subaddress: Type.Boolean(),
        original: Type.String(),
        is_integrated: Type.Boolean(),
    },
    {
        $id: 'MoneroTransactionDestinationEntry',
    },
);

export type MoneroTransactionRsigData = Static<typeof MoneroTransactionRsigData>;
export const MoneroTransactionRsigData = Type.Object(
    {
        rsig_type: Type.Number(),
        offload_type: Type.Optional(Type.Number()),
        grouping: Type.Array(Type.Number()),
        mask: Type.Optional(Type.String()),
        rsig: Type.Optional(Type.String()),
        rsig_parts: Type.Optional(Type.Array(Type.String())),
        bp_version: Type.Number(),
    },
    {
        $id: 'MoneroTransactionRsigData',
    },
);

export type MoneroTransactionData = Static<typeof MoneroTransactionData>;
export const MoneroTransactionData = Type.Object(
    {
        version: Type.Number(),
        payment_id: Type.Optional(Type.String()),
        unlock_time: Type.Number(),
        outputs: Type.Array(MoneroTransactionDestinationEntry),
        change_dts: Type.Optional(MoneroTransactionDestinationEntry),
        num_inputs: Type.Number(),
        mixin: Type.Number(),
        fee: Type.Number(),
        account: Type.Number(),
        rsig_data: MoneroTransactionRsigData,
        minor_indices: Type.Optional(Type.Array(Type.Number())),
        integrated_indices: Type.Optional(Type.Array(Type.Number())),
        client_version: Type.Number(),
        hard_fork: Type.Number(),
        monero_version: Type.Optional(Type.String()),
        chunkify: Type.Optional(Type.Boolean()),
    },
    {
        $id: 'MoneroTransactionData',
    },
);

export type MoneroSignTransaction = Static<typeof MoneroSignTransaction>;
export const MoneroSignTransaction = Type.Object(
    {
        path: DerivationPath,
        networkType: PROTO.EnumMoneroNetworkType,
        tsx_data: MoneroTransactionData,
        inputs: Type.Array(MoneroTransactionSourceEntry),
    },
    {
        $id: 'MoneroSignTransaction',
    },
);

export type MoneroRingCtSig = Static<typeof MoneroRingCtSig>;
export const MoneroRingCtSig = Type.Object(
    {
        txn_fee: Type.Optional(Type.Number()),
        message: Type.Optional(Type.String()),
        rv_type: Type.Optional(Type.Number()),
    },
    {
        $id: 'MoneroRingCtSig',
    },
);

export type MoneroSignedTransaction = Static<typeof MoneroSignedTransaction>;
export const MoneroSignedTransaction = Type.Object(
    {
        signatures: Type.Array(Type.String()),
        tx_prefix_hash: Type.String(),
        rv: MoneroRingCtSig,
        cout_key: Type.Optional(Type.String()),
        salt: Type.Optional(Type.String()),
        rand_mult: Type.Optional(Type.String()),
        tx_enc_keys: Type.Optional(Type.String()),
        opening_key: Type.Optional(Type.String()),
        pseudo_outs: Type.Array(Type.String()),
        out_pks: Type.Array(Type.String()),
        ecdh_infos: Type.Array(Type.String()),
        tx_outs: Type.Array(Type.String()),
        rsig_parts: Type.Array(Type.String()),
        extra: Type.Optional(Type.String()),
    },
    {
        $id: 'MoneroSignedTransaction',
    },
);
