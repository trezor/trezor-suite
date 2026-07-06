import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

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

// moneroSendTransaction

export type MoneroSendDestination = Static<typeof MoneroSendDestination>;
export const MoneroSendDestination = Type.Object({
    address: Type.String(),
    amount: Type.String(), // piconero, decimal string
});

// A decrypted key image (+ its spend signature), hex. Exported from the device and imported into the
// scanning wallet (wallet2 import_key_images, which verifies the signature).
export type MoneroSyncKeyImagePair = Static<typeof MoneroSyncKeyImagePair>;
export const MoneroSyncKeyImagePair = Type.Object({
    keyImage: Type.String(),
    signature: Type.String(),
});

export type MoneroSendTransaction = Static<typeof MoneroSendTransaction>;
export const MoneroSendTransaction = Type.Object(
    {
        path: DerivationPath,
        coin: Type.Optional(Type.String()),
        descriptor: Type.String(), // the account's primary (change) address
        destinations: Type.Array(MoneroSendDestination),
        account: Type.Optional(Type.Number()),
        ringSize: Type.Optional(Type.Number()),
        identity: Type.Optional(Type.String()),
        // Sweep the whole balance to the (single) destination: spend every output, no change.
        isMax: Type.Optional(Type.Boolean()),
        // Build + sign + validate but do not broadcast (the send form relays separately).
        doNotRelay: Type.Optional(Type.Boolean()),
    },
    {
        $id: 'MoneroSendTransaction',
    },
);

export type MoneroSendTransactionResult = Static<typeof MoneroSendTransactionResult>;
export const MoneroSendTransactionResult = Type.Object(
    {
        txHex: Type.String(), // the serialized, relayed transaction
        txKey: Type.String(), // reserved (tx secret key); empty for now
        relayed: Type.Boolean(),
        fee: Type.String(), // piconero, decimal string
        change: Type.String(), // piconero, decimal string
        // Key images (+ spend signatures) for every owned output, transfer order — exported on the
        // device while signing. The send form passes these to moneroSyncKeyImages so the after-send
        // import is device-free (no second key-image-sync prompt).
        keyImages: Type.Optional(Type.Array(MoneroSyncKeyImagePair)),
    },
    {
        $id: 'MoneroSendTransactionResult',
    },
);

// moneroSyncKeyImages: export key images from the device for every owned output and import them into
// the scanning wallet, so it learns spent status and shows outgoing / self transactions.
export type MoneroSyncKeyImages = Static<typeof MoneroSyncKeyImages>;
export const MoneroSyncKeyImages = Type.Object(
    {
        path: DerivationPath,
        coin: Type.Optional(Type.String()),
        descriptor: Type.String(), // the account's primary address
        account: Type.Optional(Type.Number()),
        identity: Type.Optional(Type.String()),
        // Pre-exported key images (from a just-completed send). When present the import is device-free
        // — it skips the key-image-sync device round-trip and imports these straight into the wallet.
        // When absent, the method exports them from the device (the manual / standalone sync path).
        keyImages: Type.Optional(Type.Array(MoneroSyncKeyImagePair)),
    },
    {
        $id: 'MoneroSyncKeyImages',
    },
);

export type MoneroSyncKeyImagesResult = Static<typeof MoneroSyncKeyImagesResult>;
export const MoneroSyncKeyImagesResult = Type.Object(
    {
        imported: Type.Number(), // number of key images exported + imported
    },
    {
        $id: 'MoneroSyncKeyImagesResult',
    },
);

// moneroComposeTransaction (fee estimation for the send form; no device)

export type MoneroComposeTransaction = Static<typeof MoneroComposeTransaction>;
export const MoneroComposeTransaction = Type.Object(
    {
        coin: Type.Optional(Type.String()),
        descriptor: Type.String(),
        destinations: Type.Array(MoneroSendDestination),
        // Estimate spending the whole balance (send-max): returns the maximum sendable amount.
        isMax: Type.Optional(Type.Boolean()),
        account: Type.Optional(Type.Number()),
        ringSize: Type.Optional(Type.Number()),
        identity: Type.Optional(Type.String()),
    },
    {
        $id: 'MoneroComposeTransaction',
    },
);

export type MoneroComposeTransactionResult = Static<typeof MoneroComposeTransactionResult>;
export const MoneroComposeTransactionResult = Type.Object(
    {
        fee: Type.String(), // piconero, decimal string
        // Whether the spendable outputs cover the requested amount + fee.
        sufficient: Type.Boolean(),
        // Maximum amount sendable in one transaction (total - fee for spending all outputs), piconero.
        max: Type.String(),
    },
    {
        $id: 'MoneroComposeTransactionResult',
    },
);
