import { Type, Static } from '@trezor/schema-utils';

export enum DeviceModelInternal {
    T1B1 = 'T1B1',
    T2T1 = 'T2T1',
    T2B1 = 'T2B1',
}

export type EnumDeviceModelInternal = Static<typeof EnumDeviceModelInternal>;
export const EnumDeviceModelInternal = Type.Enum(DeviceModelInternal);

export type BinanceGetAddress = Static<typeof BinanceGetAddress>;
export const BinanceGetAddress = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type BinanceAddress = Static<typeof BinanceAddress>;
export const BinanceAddress = Type.Object({
    address: Type.String(),
});

export type BinanceGetPublicKey = Static<typeof BinanceGetPublicKey>;
export const BinanceGetPublicKey = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
});

export type BinancePublicKey = Static<typeof BinancePublicKey>;
export const BinancePublicKey = Type.Object({
    public_key: Type.String(),
});

export type BinanceSignTx = Static<typeof BinanceSignTx>;
export const BinanceSignTx = Type.Object({
    address_n: Type.Array(Type.Number()),
    msg_count: Type.Number(),
    account_number: Type.Number(),
    chain_id: Type.Optional(Type.String()),
    memo: Type.Optional(Type.String()),
    sequence: Type.Number(),
    source: Type.Number(),
    chunkify: Type.Optional(Type.Boolean()),
});

export type BinanceTxRequest = Static<typeof BinanceTxRequest>;
export const BinanceTxRequest = Type.Object({});

export type BinanceCoin = Static<typeof BinanceCoin>;
export const BinanceCoin = Type.Object({
    amount: Type.Uint(),
    denom: Type.String(),
});

export type BinanceInputOutput = Static<typeof BinanceInputOutput>;
export const BinanceInputOutput = Type.Object({
    address: Type.String(),
    coins: Type.Array(BinanceCoin),
});

export type BinanceTransferMsg = Static<typeof BinanceTransferMsg>;
export const BinanceTransferMsg = Type.Object({
    inputs: Type.Array(BinanceInputOutput),
    outputs: Type.Array(BinanceInputOutput),
    chunkify: Type.Optional(Type.Boolean()),
});

export enum BinanceOrderType {
    OT_UNKNOWN = 0,
    MARKET = 1,
    LIMIT = 2,
    OT_RESERVED = 3,
}

export type EnumBinanceOrderType = Static<typeof EnumBinanceOrderType>;
export const EnumBinanceOrderType = Type.Enum(BinanceOrderType);

export enum BinanceOrderSide {
    SIDE_UNKNOWN = 0,
    BUY = 1,
    SELL = 2,
}

export type EnumBinanceOrderSide = Static<typeof EnumBinanceOrderSide>;
export const EnumBinanceOrderSide = Type.Enum(BinanceOrderSide);

export enum BinanceTimeInForce {
    TIF_UNKNOWN = 0,
    GTE = 1,
    TIF_RESERVED = 2,
    IOC = 3,
}

export type EnumBinanceTimeInForce = Static<typeof EnumBinanceTimeInForce>;
export const EnumBinanceTimeInForce = Type.Enum(BinanceTimeInForce);

export type BinanceOrderMsg = Static<typeof BinanceOrderMsg>;
export const BinanceOrderMsg = Type.Object({
    id: Type.Optional(Type.String()),
    ordertype: EnumBinanceOrderType,
    price: Type.Number(),
    quantity: Type.Number(),
    sender: Type.Optional(Type.String()),
    side: EnumBinanceOrderSide,
    symbol: Type.Optional(Type.String()),
    timeinforce: EnumBinanceTimeInForce,
});

export type BinanceCancelMsg = Static<typeof BinanceCancelMsg>;
export const BinanceCancelMsg = Type.Object({
    refid: Type.Optional(Type.String()),
    sender: Type.Optional(Type.String()),
    symbol: Type.Optional(Type.String()),
});

export type BinanceSignedTx = Static<typeof BinanceSignedTx>;
export const BinanceSignedTx = Type.Object({
    signature: Type.String(),
    public_key: Type.String(),
});

export enum Enum_InputScriptType {
    SPENDADDRESS = 0,
    SPENDMULTISIG = 1,
    EXTERNAL = 2,
    SPENDWITNESS = 3,
    SPENDP2SHWITNESS = 4,
    SPENDTAPROOT = 5,
}

export type EnumEnum_InputScriptType = Static<typeof EnumEnum_InputScriptType>;
export const EnumEnum_InputScriptType = Type.Enum(Enum_InputScriptType);

export type InputScriptType = Static<typeof InputScriptType>;
export const InputScriptType = Type.KeyOfEnum(Enum_InputScriptType);

export enum Enum_OutputScriptType {
    PAYTOADDRESS = 0,
    PAYTOSCRIPTHASH = 1,
    PAYTOMULTISIG = 2,
    PAYTOOPRETURN = 3,
    PAYTOWITNESS = 4,
    PAYTOP2SHWITNESS = 5,
    PAYTOTAPROOT = 6,
}

export type EnumEnum_OutputScriptType = Static<typeof EnumEnum_OutputScriptType>;
export const EnumEnum_OutputScriptType = Type.Enum(Enum_OutputScriptType);

export type OutputScriptType = Static<typeof OutputScriptType>;
export const OutputScriptType = Type.KeyOfEnum(Enum_OutputScriptType);

export enum DecredStakingSpendType {
    SSGen = 0,
    SSRTX = 1,
}

export type EnumDecredStakingSpendType = Static<typeof EnumDecredStakingSpendType>;
export const EnumDecredStakingSpendType = Type.Enum(DecredStakingSpendType);

export enum AmountUnit {
    BITCOIN = 0,
    MILLIBITCOIN = 1,
    MICROBITCOIN = 2,
    SATOSHI = 3,
}

export type EnumAmountUnit = Static<typeof EnumAmountUnit>;
export const EnumAmountUnit = Type.Enum(AmountUnit);

export type HDNodeType = Static<typeof HDNodeType>;
export const HDNodeType = Type.Object({
    depth: Type.Number(),
    fingerprint: Type.Number(),
    child_num: Type.Number(),
    chain_code: Type.String(),
    private_key: Type.Optional(Type.String()),
    public_key: Type.String(),
});

export type HDNodePathType = Static<typeof HDNodePathType>;
export const HDNodePathType = Type.Object({
    node: Type.Union([HDNodeType, Type.String()]),
    address_n: Type.Array(Type.Number()),
});

export type MultisigRedeemScriptType = Static<typeof MultisigRedeemScriptType>;
export const MultisigRedeemScriptType = Type.Object({
    pubkeys: Type.Array(HDNodePathType),
    signatures: Type.Array(Type.String()),
    m: Type.Number(),
    nodes: Type.Optional(Type.Array(HDNodeType)),
    address_n: Type.Optional(Type.Array(Type.Number())),
});

export type GetPublicKey = Static<typeof GetPublicKey>;
export const GetPublicKey = Type.Object({
    address_n: Type.Array(Type.Number()),
    ecdsa_curve_name: Type.Optional(Type.String()),
    show_display: Type.Optional(Type.Boolean()),
    coin_name: Type.Optional(Type.String()),
    script_type: Type.Optional(InputScriptType),
    ignore_xpub_magic: Type.Optional(Type.Boolean()),
});

export type PublicKey = Static<typeof PublicKey>;
export const PublicKey = Type.Object({
    node: HDNodeType,
    xpub: Type.String(),
    root_fingerprint: Type.Optional(Type.Number()),
});

export type GetAddress = Static<typeof GetAddress>;
export const GetAddress = Type.Object({
    address_n: Type.Array(Type.Number()),
    coin_name: Type.Optional(Type.String()),
    show_display: Type.Optional(Type.Boolean()),
    multisig: Type.Optional(MultisigRedeemScriptType),
    script_type: Type.Optional(InputScriptType),
    ignore_xpub_magic: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type Address = Static<typeof Address>;
export const Address = Type.Object({
    address: Type.String(),
    mac: Type.Optional(Type.String()),
});

export type GetOwnershipId = Static<typeof GetOwnershipId>;
export const GetOwnershipId = Type.Object({
    address_n: Type.Array(Type.Number()),
    coin_name: Type.Optional(Type.String()),
    multisig: Type.Optional(MultisigRedeemScriptType),
    script_type: Type.Optional(InputScriptType),
});

export type OwnershipId = Static<typeof OwnershipId>;
export const OwnershipId = Type.Object({
    ownership_id: Type.String(),
});

export type SignMessage = Static<typeof SignMessage>;
export const SignMessage = Type.Object({
    address_n: Type.Array(Type.Number()),
    message: Type.String(),
    coin_name: Type.Optional(Type.String()),
    script_type: Type.Optional(InputScriptType),
    no_script_type: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type MessageSignature = Static<typeof MessageSignature>;
export const MessageSignature = Type.Object({
    address: Type.String(),
    signature: Type.String(),
});

export type VerifyMessage = Static<typeof VerifyMessage>;
export const VerifyMessage = Type.Object({
    address: Type.String(),
    signature: Type.String(),
    message: Type.String(),
    coin_name: Type.Optional(Type.String()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type CoinJoinRequest = Static<typeof CoinJoinRequest>;
export const CoinJoinRequest = Type.Object({
    fee_rate: Type.Number(),
    no_fee_threshold: Type.Number(),
    min_registrable_amount: Type.Number(),
    mask_public_key: Type.String(),
    signature: Type.String(),
});

export type SignTx = Static<typeof SignTx>;
export const SignTx = Type.Object({
    outputs_count: Type.Number(),
    inputs_count: Type.Number(),
    coin_name: Type.Optional(Type.String()),
    version: Type.Optional(Type.Number()),
    lock_time: Type.Optional(Type.Number()),
    expiry: Type.Optional(Type.Number()),
    overwintered: Type.Optional(Type.Boolean()),
    version_group_id: Type.Optional(Type.Number()),
    timestamp: Type.Optional(Type.Number()),
    branch_id: Type.Optional(Type.Number()),
    amount_unit: Type.Optional(EnumAmountUnit),
    decred_staking_ticket: Type.Optional(Type.Boolean()),
    serialize: Type.Optional(Type.Boolean()),
    coinjoin_request: Type.Optional(CoinJoinRequest),
    chunkify: Type.Optional(Type.Boolean()),
});

export enum Enum_RequestType {
    TXINPUT = 0,
    TXOUTPUT = 1,
    TXMETA = 2,
    TXFINISHED = 3,
    TXEXTRADATA = 4,
    TXORIGINPUT = 5,
    TXORIGOUTPUT = 6,
    TXPAYMENTREQ = 7,
}

export type EnumEnum_RequestType = Static<typeof EnumEnum_RequestType>;
export const EnumEnum_RequestType = Type.Enum(Enum_RequestType);

export type RequestType = Static<typeof RequestType>;
export const RequestType = Type.KeyOfEnum(Enum_RequestType);

export type TxRequestDetailsType = Static<typeof TxRequestDetailsType>;
export const TxRequestDetailsType = Type.Object({
    request_index: Type.Number(),
    tx_hash: Type.Optional(Type.String()),
    extra_data_len: Type.Optional(Type.Number()),
    extra_data_offset: Type.Optional(Type.Number()),
});

export type TxRequestSerializedType = Static<typeof TxRequestSerializedType>;
export const TxRequestSerializedType = Type.Object({
    signature_index: Type.Optional(Type.Number()),
    signature: Type.Optional(Type.String()),
    serialized_tx: Type.Optional(Type.String()),
});

export type TxRequest = Static<typeof TxRequest>;
export const TxRequest = Type.Object({
    request_type: RequestType,
    details: TxRequestDetailsType,
    serialized: Type.Optional(TxRequestSerializedType),
});

export type InternalInputScriptType = Static<typeof InternalInputScriptType>;
export const InternalInputScriptType = Type.Exclude(InputScriptType, Type.Literal('EXTERNAL'));

type CommonTxInputType = Static<typeof CommonTxInputType>;
const CommonTxInputType = Type.Object({
    prev_hash: Type.String(),
    prev_index: Type.Number(),
    amount: Type.Uint(),
    sequence: Type.Optional(Type.Number()),
    multisig: Type.Optional(MultisigRedeemScriptType),
    decred_tree: Type.Optional(Type.Number()),
    orig_hash: Type.Optional(Type.String()),
    orig_index: Type.Optional(Type.Number()),
    decred_staking_spend: Type.Optional(EnumDecredStakingSpendType),
    script_pubkey: Type.Optional(Type.String()),
    coinjoin_flags: Type.Optional(Type.Number()),
    script_sig: Type.Optional(Type.String()),
    witness: Type.Optional(Type.String()),
    ownership_proof: Type.Optional(Type.String()),
    commitment_data: Type.Optional(Type.String()),
});

export type TxInputType = Static<typeof TxInputType>;
export const TxInputType = Type.Union([
    Type.Intersect([
        CommonTxInputType,
        Type.Object({
            address_n: Type.Array(Type.Number()),
            script_type: Type.Optional(InternalInputScriptType),
        }),
    ]),
    Type.Intersect([
        CommonTxInputType,
        Type.Object({
            address_n: Type.Optional(Type.Undefined()),
            script_type: Type.Literal('EXTERNAL'),
            script_pubkey: Type.String(),
        }),
    ]),
]);

export type TxInput = Static<typeof TxInput>;
export const TxInput = TxInputType;

export type TxOutputBinType = Static<typeof TxOutputBinType>;
export const TxOutputBinType = Type.Object({
    amount: Type.Uint(),
    script_pubkey: Type.String(),
    decred_script_version: Type.Optional(Type.Number()),
});

export type ChangeOutputScriptType = Static<typeof ChangeOutputScriptType>;
export const ChangeOutputScriptType = Type.Exclude(OutputScriptType, Type.Literal('PAYTOOPRETURN'));

export type TxOutputType = Static<typeof TxOutputType>;
export const TxOutputType = Type.Union([
    Type.Object({
        address: Type.String(),
        address_n: Type.Optional(Type.Undefined()),
        script_type: Type.Literal('PAYTOADDRESS'),
        amount: Type.Uint(),
        multisig: Type.Optional(MultisigRedeemScriptType),
        orig_hash: Type.Optional(Type.String()),
        orig_index: Type.Optional(Type.Number()),
        payment_req_index: Type.Optional(Type.Number()),
    }),
    Type.Object({
        address: Type.Optional(Type.Undefined()),
        address_n: Type.Array(Type.Number()),
        script_type: Type.Optional(ChangeOutputScriptType),
        amount: Type.Uint(),
        multisig: Type.Optional(MultisigRedeemScriptType),
        orig_hash: Type.Optional(Type.String()),
        orig_index: Type.Optional(Type.Number()),
        payment_req_index: Type.Optional(Type.Number()),
    }),
    Type.Object({
        address: Type.String(),
        address_n: Type.Optional(Type.Undefined()),
        script_type: Type.Optional(ChangeOutputScriptType),
        amount: Type.Uint(),
        multisig: Type.Optional(MultisigRedeemScriptType),
        orig_hash: Type.Optional(Type.String()),
        orig_index: Type.Optional(Type.Number()),
        payment_req_index: Type.Optional(Type.Number()),
    }),
    Type.Object({
        address: Type.Optional(Type.Undefined()),
        address_n: Type.Optional(Type.Undefined()),
        amount: Type.Union([Type.Literal('0'), Type.Literal(0)]),
        op_return_data: Type.String(),
        script_type: Type.Literal('PAYTOOPRETURN'),
        orig_hash: Type.Optional(Type.String()),
        orig_index: Type.Optional(Type.Number()),
        payment_req_index: Type.Optional(Type.Number()),
    }),
]);

export type TxOutput = Static<typeof TxOutput>;
export const TxOutput = TxOutputType;

export type PrevTx = Static<typeof PrevTx>;
export const PrevTx = Type.Object({
    version: Type.Number(),
    lock_time: Type.Number(),
    inputs_count: Type.Number(),
    outputs_count: Type.Number(),
    extra_data_len: Type.Optional(Type.Number()),
    expiry: Type.Optional(Type.Number()),
    version_group_id: Type.Optional(Type.Number()),
    timestamp: Type.Optional(Type.Number()),
    branch_id: Type.Optional(Type.Number()),
});

export type PrevInput = Static<typeof PrevInput>;
export const PrevInput = Type.Object({
    prev_hash: Type.String(),
    prev_index: Type.Number(),
    script_sig: Type.String(),
    sequence: Type.Number(),
    decred_tree: Type.Optional(Type.Number()),
});

export type PrevOutput = Static<typeof PrevOutput>;
export const PrevOutput = Type.Object({
    amount: Type.Uint(),
    script_pubkey: Type.String(),
    decred_script_version: Type.Optional(Type.Number()),
});

export type TextMemo = Static<typeof TextMemo>;
export const TextMemo = Type.Object({
    text: Type.String(),
});

export type RefundMemo = Static<typeof RefundMemo>;
export const RefundMemo = Type.Object({
    address: Type.String(),
    mac: Type.String(),
});

export type CoinPurchaseMemo = Static<typeof CoinPurchaseMemo>;
export const CoinPurchaseMemo = Type.Object({
    coin_type: Type.Number(),
    amount: Type.Uint(),
    address: Type.String(),
    mac: Type.String(),
});

export type PaymentRequestMemo = Static<typeof PaymentRequestMemo>;
export const PaymentRequestMemo = Type.Object({
    text_memo: Type.Optional(TextMemo),
    refund_memo: Type.Optional(RefundMemo),
    coin_purchase_memo: Type.Optional(CoinPurchaseMemo),
});

export type TxAckPaymentRequest = Static<typeof TxAckPaymentRequest>;
export const TxAckPaymentRequest = Type.Object({
    nonce: Type.Optional(Type.String()),
    recipient_name: Type.String(),
    memos: Type.Optional(Type.Array(PaymentRequestMemo)),
    amount: Type.Optional(Type.Uint()),
    signature: Type.String(),
});

export type TxAckResponse = Static<typeof TxAckResponse>;
export const TxAckResponse = Type.Union([
    Type.Object({
        inputs: Type.Array(Type.Union([TxInputType, PrevInput])),
    }),
    Type.Object({
        bin_outputs: Type.Array(TxOutputBinType),
    }),
    Type.Object({
        outputs: Type.Array(TxOutputType),
    }),
    Type.Object({
        extra_data: Type.String(),
    }),
    Type.Object({
        version: Type.Optional(Type.Number()),
        lock_time: Type.Optional(Type.Number()),
        inputs_cnt: Type.Number(),
        outputs_cnt: Type.Number(),
        extra_data: Type.Optional(Type.String()),
        extra_data_len: Type.Optional(Type.Number()),
        timestamp: Type.Optional(Type.Number()),
        version_group_id: Type.Optional(Type.Number()),
        expiry: Type.Optional(Type.Number()),
        branch_id: Type.Optional(Type.Number()),
    }),
]);

export type TxAck = Static<typeof TxAck>;
export const TxAck = Type.Object({
    tx: TxAckResponse,
});

export type TxAckInputWrapper = Static<typeof TxAckInputWrapper>;
export const TxAckInputWrapper = Type.Object({
    input: TxInput,
});

export type TxAckInput = Static<typeof TxAckInput>;
export const TxAckInput = Type.Object({
    tx: TxAckInputWrapper,
});

export type TxAckOutputWrapper = Static<typeof TxAckOutputWrapper>;
export const TxAckOutputWrapper = Type.Object({
    output: TxOutput,
});

export type TxAckOutput = Static<typeof TxAckOutput>;
export const TxAckOutput = Type.Object({
    tx: TxAckOutputWrapper,
});

export type TxAckPrevMeta = Static<typeof TxAckPrevMeta>;
export const TxAckPrevMeta = Type.Object({
    tx: PrevTx,
});

export type TxAckPrevInputWrapper = Static<typeof TxAckPrevInputWrapper>;
export const TxAckPrevInputWrapper = Type.Object({
    input: PrevInput,
});

export type TxAckPrevInput = Static<typeof TxAckPrevInput>;
export const TxAckPrevInput = Type.Object({
    tx: TxAckPrevInputWrapper,
});

export type TxAckPrevOutputWrapper = Static<typeof TxAckPrevOutputWrapper>;
export const TxAckPrevOutputWrapper = Type.Object({
    output: PrevOutput,
});

export type TxAckPrevOutput = Static<typeof TxAckPrevOutput>;
export const TxAckPrevOutput = Type.Object({
    tx: TxAckPrevOutputWrapper,
});

export type TxAckPrevExtraDataWrapper = Static<typeof TxAckPrevExtraDataWrapper>;
export const TxAckPrevExtraDataWrapper = Type.Object({
    extra_data_chunk: Type.String(),
});

export type TxAckPrevExtraData = Static<typeof TxAckPrevExtraData>;
export const TxAckPrevExtraData = Type.Object({
    tx: TxAckPrevExtraDataWrapper,
});

export type GetOwnershipProof = Static<typeof GetOwnershipProof>;
export const GetOwnershipProof = Type.Object({
    address_n: Type.Array(Type.Number()),
    coin_name: Type.Optional(Type.String()),
    script_type: Type.Optional(InputScriptType),
    multisig: Type.Optional(MultisigRedeemScriptType),
    user_confirmation: Type.Optional(Type.Boolean()),
    ownership_ids: Type.Optional(Type.Array(Type.String())),
    commitment_data: Type.Optional(Type.String()),
});

export type OwnershipProof = Static<typeof OwnershipProof>;
export const OwnershipProof = Type.Object({
    ownership_proof: Type.String(),
    signature: Type.String(),
});

export type AuthorizeCoinJoin = Static<typeof AuthorizeCoinJoin>;
export const AuthorizeCoinJoin = Type.Object({
    coordinator: Type.String(),
    max_rounds: Type.Number(),
    max_coordinator_fee_rate: Type.Number(),
    max_fee_per_kvbyte: Type.Number(),
    address_n: Type.Array(Type.Number()),
    coin_name: Type.Optional(Type.String()),
    script_type: Type.Optional(InputScriptType),
    amount_unit: Type.Optional(EnumAmountUnit),
});

export type FirmwareErase = Static<typeof FirmwareErase>;
export const FirmwareErase = Type.Object({
    length: Type.Optional(Type.Number()),
});

export type FirmwareRequest = Static<typeof FirmwareRequest>;
export const FirmwareRequest = Type.Object({
    offset: Type.Number(),
    length: Type.Number(),
});

export type FirmwareUpload = Static<typeof FirmwareUpload>;
export const FirmwareUpload = Type.Object({
    payload: Type.Union([Type.Buffer(), Type.ArrayBuffer()]),
    hash: Type.Optional(Type.String()),
});

export type SelfTest = Static<typeof SelfTest>;
export const SelfTest = Type.Object({
    payload: Type.Optional(Type.String()),
});

export enum CardanoDerivationType {
    LEDGER = 0,
    ICARUS = 1,
    ICARUS_TREZOR = 2,
}

export type EnumCardanoDerivationType = Static<typeof EnumCardanoDerivationType>;
export const EnumCardanoDerivationType = Type.Enum(CardanoDerivationType);

export enum CardanoAddressType {
    BASE = 0,
    BASE_SCRIPT_KEY = 1,
    BASE_KEY_SCRIPT = 2,
    BASE_SCRIPT_SCRIPT = 3,
    POINTER = 4,
    POINTER_SCRIPT = 5,
    ENTERPRISE = 6,
    ENTERPRISE_SCRIPT = 7,
    BYRON = 8,
    REWARD = 14,
    REWARD_SCRIPT = 15,
}

export type EnumCardanoAddressType = Static<typeof EnumCardanoAddressType>;
export const EnumCardanoAddressType = Type.Enum(CardanoAddressType);

export enum CardanoNativeScriptType {
    PUB_KEY = 0,
    ALL = 1,
    ANY = 2,
    N_OF_K = 3,
    INVALID_BEFORE = 4,
    INVALID_HEREAFTER = 5,
}

export type EnumCardanoNativeScriptType = Static<typeof EnumCardanoNativeScriptType>;
export const EnumCardanoNativeScriptType = Type.Enum(CardanoNativeScriptType);

export enum CardanoNativeScriptHashDisplayFormat {
    HIDE = 0,
    BECH32 = 1,
    POLICY_ID = 2,
}

export type EnumCardanoNativeScriptHashDisplayFormat = Static<
    typeof EnumCardanoNativeScriptHashDisplayFormat
>;
export const EnumCardanoNativeScriptHashDisplayFormat = Type.Enum(
    CardanoNativeScriptHashDisplayFormat,
);

export enum CardanoTxOutputSerializationFormat {
    ARRAY_LEGACY = 0,
    MAP_BABBAGE = 1,
}

export type EnumCardanoTxOutputSerializationFormat = Static<
    typeof EnumCardanoTxOutputSerializationFormat
>;
export const EnumCardanoTxOutputSerializationFormat = Type.Enum(CardanoTxOutputSerializationFormat);

export enum CardanoCertificateType {
    STAKE_REGISTRATION = 0,
    STAKE_DEREGISTRATION = 1,
    STAKE_DELEGATION = 2,
    STAKE_POOL_REGISTRATION = 3,
}

export type EnumCardanoCertificateType = Static<typeof EnumCardanoCertificateType>;
export const EnumCardanoCertificateType = Type.Enum(CardanoCertificateType);

export enum CardanoPoolRelayType {
    SINGLE_HOST_IP = 0,
    SINGLE_HOST_NAME = 1,
    MULTIPLE_HOST_NAME = 2,
}

export type EnumCardanoPoolRelayType = Static<typeof EnumCardanoPoolRelayType>;
export const EnumCardanoPoolRelayType = Type.Enum(CardanoPoolRelayType);

export enum CardanoTxAuxiliaryDataSupplementType {
    NONE = 0,
    CVOTE_REGISTRATION_SIGNATURE = 1,
}

export type EnumCardanoTxAuxiliaryDataSupplementType = Static<
    typeof EnumCardanoTxAuxiliaryDataSupplementType
>;
export const EnumCardanoTxAuxiliaryDataSupplementType = Type.Enum(
    CardanoTxAuxiliaryDataSupplementType,
);

export enum CardanoCVoteRegistrationFormat {
    CIP15 = 0,
    CIP36 = 1,
}

export type EnumCardanoCVoteRegistrationFormat = Static<typeof EnumCardanoCVoteRegistrationFormat>;
export const EnumCardanoCVoteRegistrationFormat = Type.Enum(CardanoCVoteRegistrationFormat);

export enum CardanoTxSigningMode {
    ORDINARY_TRANSACTION = 0,
    POOL_REGISTRATION_AS_OWNER = 1,
    MULTISIG_TRANSACTION = 2,
    PLUTUS_TRANSACTION = 3,
}

export type EnumCardanoTxSigningMode = Static<typeof EnumCardanoTxSigningMode>;
export const EnumCardanoTxSigningMode = Type.Enum(CardanoTxSigningMode);

export enum CardanoTxWitnessType {
    BYRON_WITNESS = 0,
    SHELLEY_WITNESS = 1,
}

export type EnumCardanoTxWitnessType = Static<typeof EnumCardanoTxWitnessType>;
export const EnumCardanoTxWitnessType = Type.Enum(CardanoTxWitnessType);

export type CardanoBlockchainPointerType = Static<typeof CardanoBlockchainPointerType>;
export const CardanoBlockchainPointerType = Type.Object({
    block_index: Type.Number(),
    tx_index: Type.Number(),
    certificate_index: Type.Number(),
});

export type CardanoNativeScript = Static<typeof CardanoNativeScript>;
export const CardanoNativeScript = Type.Recursive(This =>
    Type.Object({
        type: EnumCardanoNativeScriptType,
        scripts: Type.Optional(Type.Array(This)),
        key_hash: Type.Optional(Type.String()),
        key_path: Type.Optional(Type.Array(Type.Number())),
        required_signatures_count: Type.Optional(Type.Number()),
        invalid_before: Type.Optional(Type.Uint()),
        invalid_hereafter: Type.Optional(Type.Uint()),
    }),
);

export type CardanoGetNativeScriptHash = Static<typeof CardanoGetNativeScriptHash>;
export const CardanoGetNativeScriptHash = Type.Object({
    script: CardanoNativeScript,
    display_format: EnumCardanoNativeScriptHashDisplayFormat,
    derivation_type: EnumCardanoDerivationType,
});

export type CardanoNativeScriptHash = Static<typeof CardanoNativeScriptHash>;
export const CardanoNativeScriptHash = Type.Object({
    script_hash: Type.String(),
});

export type CardanoAddressParametersType = Static<typeof CardanoAddressParametersType>;
export const CardanoAddressParametersType = Type.Object({
    address_type: EnumCardanoAddressType,
    address_n: Type.Array(Type.Number()),
    address_n_staking: Type.Array(Type.Number()),
    staking_key_hash: Type.Optional(Type.String()),
    certificate_pointer: Type.Optional(CardanoBlockchainPointerType),
    script_payment_hash: Type.Optional(Type.String()),
    script_staking_hash: Type.Optional(Type.String()),
});

export type CardanoGetAddress = Static<typeof CardanoGetAddress>;
export const CardanoGetAddress = Type.Object({
    show_display: Type.Optional(Type.Boolean()),
    protocol_magic: Type.Number(),
    network_id: Type.Number(),
    address_parameters: CardanoAddressParametersType,
    derivation_type: EnumCardanoDerivationType,
    chunkify: Type.Optional(Type.Boolean()),
});

export type CardanoAddress = Static<typeof CardanoAddress>;
export const CardanoAddress = Type.Object({
    address: Type.String(),
});

export type CardanoGetPublicKey = Static<typeof CardanoGetPublicKey>;
export const CardanoGetPublicKey = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    derivation_type: EnumCardanoDerivationType,
});

export type CardanoPublicKey = Static<typeof CardanoPublicKey>;
export const CardanoPublicKey = Type.Object({
    xpub: Type.String(),
    node: HDNodeType,
});

export type CardanoSignTxInit = Static<typeof CardanoSignTxInit>;
export const CardanoSignTxInit = Type.Object({
    signing_mode: EnumCardanoTxSigningMode,
    protocol_magic: Type.Number(),
    network_id: Type.Number(),
    inputs_count: Type.Number(),
    outputs_count: Type.Number(),
    fee: Type.Uint(),
    ttl: Type.Optional(Type.Uint()),
    certificates_count: Type.Number(),
    withdrawals_count: Type.Number(),
    has_auxiliary_data: Type.Boolean(),
    validity_interval_start: Type.Optional(Type.Uint()),
    witness_requests_count: Type.Number(),
    minting_asset_groups_count: Type.Number(),
    derivation_type: EnumCardanoDerivationType,
    include_network_id: Type.Optional(Type.Boolean()),
    script_data_hash: Type.Optional(Type.String()),
    collateral_inputs_count: Type.Number(),
    required_signers_count: Type.Number(),
    has_collateral_return: Type.Optional(Type.Boolean()),
    total_collateral: Type.Optional(Type.Uint()),
    reference_inputs_count: Type.Optional(Type.Number()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type CardanoTxInput = Static<typeof CardanoTxInput>;
export const CardanoTxInput = Type.Object({
    prev_hash: Type.String(),
    prev_index: Type.Number(),
});

export type CardanoTxOutput = Static<typeof CardanoTxOutput>;
export const CardanoTxOutput = Type.Object({
    address: Type.Optional(Type.String()),
    address_parameters: Type.Optional(CardanoAddressParametersType),
    amount: Type.Uint(),
    asset_groups_count: Type.Number(),
    datum_hash: Type.Optional(Type.String()),
    format: Type.Optional(EnumCardanoTxOutputSerializationFormat),
    inline_datum_size: Type.Optional(Type.Number()),
    reference_script_size: Type.Optional(Type.Number()),
});

export type CardanoAssetGroup = Static<typeof CardanoAssetGroup>;
export const CardanoAssetGroup = Type.Object({
    policy_id: Type.String(),
    tokens_count: Type.Number(),
});

export type CardanoToken = Static<typeof CardanoToken>;
export const CardanoToken = Type.Object({
    asset_name_bytes: Type.String(),
    amount: Type.Optional(Type.Uint()),
    mint_amount: Type.Optional(Type.Uint({ allowNegative: true })),
});

export type CardanoTxInlineDatumChunk = Static<typeof CardanoTxInlineDatumChunk>;
export const CardanoTxInlineDatumChunk = Type.Object({
    data: Type.String(),
});

export type CardanoTxReferenceScriptChunk = Static<typeof CardanoTxReferenceScriptChunk>;
export const CardanoTxReferenceScriptChunk = Type.Object({
    data: Type.String(),
});

export type CardanoPoolOwner = Static<typeof CardanoPoolOwner>;
export const CardanoPoolOwner = Type.Object({
    staking_key_path: Type.Optional(Type.Array(Type.Number())),
    staking_key_hash: Type.Optional(Type.String()),
});

export type CardanoPoolRelayParameters = Static<typeof CardanoPoolRelayParameters>;
export const CardanoPoolRelayParameters = Type.Object({
    type: EnumCardanoPoolRelayType,
    ipv4_address: Type.Optional(Type.String()),
    ipv6_address: Type.Optional(Type.String()),
    host_name: Type.Optional(Type.String()),
    port: Type.Optional(Type.Number()),
});

export type CardanoPoolMetadataType = Static<typeof CardanoPoolMetadataType>;
export const CardanoPoolMetadataType = Type.Object({
    url: Type.String(),
    hash: Type.String(),
});

export type CardanoPoolParametersType = Static<typeof CardanoPoolParametersType>;
export const CardanoPoolParametersType = Type.Object({
    pool_id: Type.String(),
    vrf_key_hash: Type.String(),
    pledge: Type.Uint(),
    cost: Type.Uint(),
    margin_numerator: Type.Uint(),
    margin_denominator: Type.Uint(),
    reward_account: Type.String(),
    metadata: Type.Optional(CardanoPoolMetadataType),
    owners_count: Type.Number(),
    relays_count: Type.Number(),
});

export type CardanoTxCertificate = Static<typeof CardanoTxCertificate>;
export const CardanoTxCertificate = Type.Object({
    type: EnumCardanoCertificateType,
    path: Type.Optional(Type.Array(Type.Number())),
    pool: Type.Optional(Type.String()),
    pool_parameters: Type.Optional(CardanoPoolParametersType),
    script_hash: Type.Optional(Type.String()),
    key_hash: Type.Optional(Type.String()),
});

export type CardanoTxWithdrawal = Static<typeof CardanoTxWithdrawal>;
export const CardanoTxWithdrawal = Type.Object({
    path: Type.Optional(Type.Array(Type.Number())),
    amount: Type.Uint(),
    script_hash: Type.Optional(Type.String()),
    key_hash: Type.Optional(Type.String()),
});

export type CardanoCVoteRegistrationDelegation = Static<typeof CardanoCVoteRegistrationDelegation>;
export const CardanoCVoteRegistrationDelegation = Type.Object({
    vote_public_key: Type.String(),
    weight: Type.Uint(),
});

export type CardanoCVoteRegistrationParametersType = Static<
    typeof CardanoCVoteRegistrationParametersType
>;
export const CardanoCVoteRegistrationParametersType = Type.Object({
    vote_public_key: Type.Optional(Type.String()),
    staking_path: Type.Array(Type.Number()),
    payment_address_parameters: Type.Optional(CardanoAddressParametersType),
    nonce: Type.Uint(),
    format: Type.Optional(EnumCardanoCVoteRegistrationFormat),
    delegations: Type.Optional(Type.Array(CardanoCVoteRegistrationDelegation)),
    voting_purpose: Type.Optional(Type.Uint()),
    payment_address: Type.Optional(Type.String()),
});

export type CardanoTxAuxiliaryData = Static<typeof CardanoTxAuxiliaryData>;
export const CardanoTxAuxiliaryData = Type.Object({
    cvote_registration_parameters: Type.Optional(CardanoCVoteRegistrationParametersType),
    hash: Type.Optional(Type.String()),
});

export type CardanoTxMint = Static<typeof CardanoTxMint>;
export const CardanoTxMint = Type.Object({
    asset_groups_count: Type.Number(),
});

export type CardanoTxCollateralInput = Static<typeof CardanoTxCollateralInput>;
export const CardanoTxCollateralInput = Type.Object({
    prev_hash: Type.String(),
    prev_index: Type.Number(),
});

export type CardanoTxRequiredSigner = Static<typeof CardanoTxRequiredSigner>;
export const CardanoTxRequiredSigner = Type.Object({
    key_hash: Type.Optional(Type.String()),
    key_path: Type.Optional(Type.Array(Type.Number())),
});

export type CardanoTxReferenceInput = Static<typeof CardanoTxReferenceInput>;
export const CardanoTxReferenceInput = Type.Object({
    prev_hash: Type.String(),
    prev_index: Type.Number(),
});

export type CardanoTxItemAck = Static<typeof CardanoTxItemAck>;
export const CardanoTxItemAck = Type.Object({});

export type CardanoTxAuxiliaryDataSupplement = Static<typeof CardanoTxAuxiliaryDataSupplement>;
export const CardanoTxAuxiliaryDataSupplement = Type.Object({
    type: EnumCardanoTxAuxiliaryDataSupplementType,
    auxiliary_data_hash: Type.Optional(Type.String()),
    cvote_registration_signature: Type.Optional(Type.String()),
});

export type CardanoTxWitnessRequest = Static<typeof CardanoTxWitnessRequest>;
export const CardanoTxWitnessRequest = Type.Object({
    path: Type.Array(Type.Number()),
});

export type CardanoTxWitnessResponse = Static<typeof CardanoTxWitnessResponse>;
export const CardanoTxWitnessResponse = Type.Object({
    type: EnumCardanoTxWitnessType,
    pub_key: Type.String(),
    signature: Type.String(),
    chain_code: Type.Optional(Type.String()),
});

export type CardanoTxHostAck = Static<typeof CardanoTxHostAck>;
export const CardanoTxHostAck = Type.Object({});

export type CardanoTxBodyHash = Static<typeof CardanoTxBodyHash>;
export const CardanoTxBodyHash = Type.Object({
    tx_hash: Type.String(),
});

export type CardanoSignTxFinished = Static<typeof CardanoSignTxFinished>;
export const CardanoSignTxFinished = Type.Object({});

export type Success = Static<typeof Success>;
export const Success = Type.Object({
    message: Type.String(),
});

export enum FailureType {
    Failure_UnexpectedMessage = 1,
    Failure_ButtonExpected = 2,
    Failure_DataError = 3,
    Failure_ActionCancelled = 4,
    Failure_PinExpected = 5,
    Failure_PinCancelled = 6,
    Failure_PinInvalid = 7,
    Failure_InvalidSignature = 8,
    Failure_ProcessError = 9,
    Failure_NotEnoughFunds = 10,
    Failure_NotInitialized = 11,
    Failure_PinMismatch = 12,
    Failure_WipeCodeMismatch = 13,
    Failure_InvalidSession = 14,
    Failure_FirmwareError = 99,
}

export type EnumFailureType = Static<typeof EnumFailureType>;
export const EnumFailureType = Type.Enum(FailureType);

export type Failure = Static<typeof Failure>;
export const Failure = Type.Object({
    code: Type.Optional(EnumFailureType),
    message: Type.Optional(Type.String()),
});

export enum Enum_ButtonRequestType {
    ButtonRequest_Other = 1,
    ButtonRequest_FeeOverThreshold = 2,
    ButtonRequest_ConfirmOutput = 3,
    ButtonRequest_ResetDevice = 4,
    ButtonRequest_ConfirmWord = 5,
    ButtonRequest_WipeDevice = 6,
    ButtonRequest_ProtectCall = 7,
    ButtonRequest_SignTx = 8,
    ButtonRequest_FirmwareCheck = 9,
    ButtonRequest_Address = 10,
    ButtonRequest_PublicKey = 11,
    ButtonRequest_MnemonicWordCount = 12,
    ButtonRequest_MnemonicInput = 13,
    _Deprecated_ButtonRequest_PassphraseType = 14,
    ButtonRequest_UnknownDerivationPath = 15,
    ButtonRequest_RecoveryHomepage = 16,
    ButtonRequest_Success = 17,
    ButtonRequest_Warning = 18,
    ButtonRequest_PassphraseEntry = 19,
    ButtonRequest_PinEntry = 20,
}

export type EnumEnum_ButtonRequestType = Static<typeof EnumEnum_ButtonRequestType>;
export const EnumEnum_ButtonRequestType = Type.Enum(Enum_ButtonRequestType);

export type ButtonRequestType = Static<typeof ButtonRequestType>;
export const ButtonRequestType = Type.KeyOfEnum(Enum_ButtonRequestType);

export type ButtonRequest = Static<typeof ButtonRequest>;
export const ButtonRequest = Type.Object({
    code: Type.Optional(ButtonRequestType),
    pages: Type.Optional(Type.Number()),
});

export type ButtonAck = Static<typeof ButtonAck>;
export const ButtonAck = Type.Object({});

export enum Enum_PinMatrixRequestType {
    PinMatrixRequestType_Current = 1,
    PinMatrixRequestType_NewFirst = 2,
    PinMatrixRequestType_NewSecond = 3,
    PinMatrixRequestType_WipeCodeFirst = 4,
    PinMatrixRequestType_WipeCodeSecond = 5,
}

export type EnumEnum_PinMatrixRequestType = Static<typeof EnumEnum_PinMatrixRequestType>;
export const EnumEnum_PinMatrixRequestType = Type.Enum(Enum_PinMatrixRequestType);

export type PinMatrixRequestType = Static<typeof PinMatrixRequestType>;
export const PinMatrixRequestType = Type.KeyOfEnum(Enum_PinMatrixRequestType);

export type PinMatrixRequest = Static<typeof PinMatrixRequest>;
export const PinMatrixRequest = Type.Object({
    type: Type.Optional(PinMatrixRequestType),
});

export type PinMatrixAck = Static<typeof PinMatrixAck>;
export const PinMatrixAck = Type.Object({
    pin: Type.String(),
});

export type PassphraseRequest = Static<typeof PassphraseRequest>;
export const PassphraseRequest = Type.Object({
    _on_device: Type.Optional(Type.Boolean()),
});

export type PassphraseAck = Static<typeof PassphraseAck>;
export const PassphraseAck = Type.Object({
    passphrase: Type.Optional(Type.String()),
    _state: Type.Optional(Type.String()),
    on_device: Type.Optional(Type.Boolean()),
});

export type Deprecated_PassphraseStateRequest = Static<typeof Deprecated_PassphraseStateRequest>;
export const Deprecated_PassphraseStateRequest = Type.Object({
    state: Type.Optional(Type.String()),
});

export type Deprecated_PassphraseStateAck = Static<typeof Deprecated_PassphraseStateAck>;
export const Deprecated_PassphraseStateAck = Type.Object({});

export type CipherKeyValue = Static<typeof CipherKeyValue>;
export const CipherKeyValue = Type.Object({
    address_n: Type.Array(Type.Number()),
    key: Type.String(),
    value: Type.String(),
    encrypt: Type.Optional(Type.Boolean()),
    ask_on_encrypt: Type.Optional(Type.Boolean()),
    ask_on_decrypt: Type.Optional(Type.Boolean()),
    iv: Type.Optional(Type.String()),
});

export type CipheredKeyValue = Static<typeof CipheredKeyValue>;
export const CipheredKeyValue = Type.Object({
    value: Type.String(),
});

export type IdentityType = Static<typeof IdentityType>;
export const IdentityType = Type.Object({
    proto: Type.Optional(Type.String()),
    user: Type.Optional(Type.String()),
    host: Type.Optional(Type.String()),
    port: Type.Optional(Type.String()),
    path: Type.Optional(Type.String()),
    index: Type.Optional(Type.Number()),
});

export type SignIdentity = Static<typeof SignIdentity>;
export const SignIdentity = Type.Object({
    identity: IdentityType,
    challenge_hidden: Type.Optional(Type.String()),
    challenge_visual: Type.Optional(Type.String()),
    ecdsa_curve_name: Type.Optional(Type.String()),
});

export type SignedIdentity = Static<typeof SignedIdentity>;
export const SignedIdentity = Type.Object({
    address: Type.String(),
    public_key: Type.String(),
    signature: Type.String(),
});

export type GetECDHSessionKey = Static<typeof GetECDHSessionKey>;
export const GetECDHSessionKey = Type.Object({
    identity: IdentityType,
    peer_public_key: Type.String(),
    ecdsa_curve_name: Type.Optional(Type.String()),
});

export type ECDHSessionKey = Static<typeof ECDHSessionKey>;
export const ECDHSessionKey = Type.Object({
    session_key: Type.String(),
    public_key: Type.Optional(Type.String()),
});

export enum DebugButton {
    NO = 0,
    YES = 1,
    INFO = 2,
}

export type EnumDebugButton = Static<typeof EnumDebugButton>;
export const EnumDebugButton = Type.Enum(DebugButton);

export enum DebugPhysicalButton {
    LEFT_BTN = 0,
    MIDDLE_BTN = 1,
    RIGHT_BTN = 2,
}

export type EnumDebugPhysicalButton = Static<typeof EnumDebugPhysicalButton>;
export const EnumDebugPhysicalButton = Type.Enum(DebugPhysicalButton);

export type DebugLinkResetDebugEvents = Static<typeof DebugLinkResetDebugEvents>;
export const DebugLinkResetDebugEvents = Type.Object({});

export type EosGetPublicKey = Static<typeof EosGetPublicKey>;
export const EosGetPublicKey = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type EosPublicKey = Static<typeof EosPublicKey>;
export const EosPublicKey = Type.Object({
    wif_public_key: Type.String(),
    raw_public_key: Type.String(),
});

export type EosTxHeader = Static<typeof EosTxHeader>;
export const EosTxHeader = Type.Object({
    expiration: Type.Number(),
    ref_block_num: Type.Number(),
    ref_block_prefix: Type.Number(),
    max_net_usage_words: Type.Number(),
    max_cpu_usage_ms: Type.Number(),
    delay_sec: Type.Number(),
});

export type EosSignTx = Static<typeof EosSignTx>;
export const EosSignTx = Type.Object({
    address_n: Type.Array(Type.Number()),
    chain_id: Type.String(),
    header: EosTxHeader,
    num_actions: Type.Number(),
    chunkify: Type.Optional(Type.Boolean()),
});

export type EosTxActionRequest = Static<typeof EosTxActionRequest>;
export const EosTxActionRequest = Type.Object({
    data_size: Type.Optional(Type.Number()),
});

export type EosAsset = Static<typeof EosAsset>;
export const EosAsset = Type.Object({
    amount: Type.Uint(),
    symbol: Type.String(),
});

export type EosPermissionLevel = Static<typeof EosPermissionLevel>;
export const EosPermissionLevel = Type.Object({
    actor: Type.String(),
    permission: Type.String(),
});

export type EosAuthorizationKey = Static<typeof EosAuthorizationKey>;
export const EosAuthorizationKey = Type.Object({
    type: Type.Optional(Type.Number()),
    key: Type.String(),
    address_n: Type.Optional(Type.Array(Type.Number())),
    weight: Type.Number(),
});

export type EosAuthorizationAccount = Static<typeof EosAuthorizationAccount>;
export const EosAuthorizationAccount = Type.Object({
    account: EosPermissionLevel,
    weight: Type.Number(),
});

export type EosAuthorizationWait = Static<typeof EosAuthorizationWait>;
export const EosAuthorizationWait = Type.Object({
    wait_sec: Type.Number(),
    weight: Type.Number(),
});

export type EosAuthorization = Static<typeof EosAuthorization>;
export const EosAuthorization = Type.Object({
    threshold: Type.Number(),
    keys: Type.Array(EosAuthorizationKey),
    accounts: Type.Array(EosAuthorizationAccount),
    waits: Type.Array(EosAuthorizationWait),
});

export type EosActionCommon = Static<typeof EosActionCommon>;
export const EosActionCommon = Type.Object({
    account: Type.String(),
    name: Type.String(),
    authorization: Type.Array(EosPermissionLevel),
});

export type EosActionTransfer = Static<typeof EosActionTransfer>;
export const EosActionTransfer = Type.Object({
    sender: Type.String(),
    receiver: Type.String(),
    quantity: EosAsset,
    memo: Type.String(),
});

export type EosActionDelegate = Static<typeof EosActionDelegate>;
export const EosActionDelegate = Type.Object({
    sender: Type.String(),
    receiver: Type.String(),
    net_quantity: EosAsset,
    cpu_quantity: EosAsset,
    transfer: Type.Boolean(),
});

export type EosActionUndelegate = Static<typeof EosActionUndelegate>;
export const EosActionUndelegate = Type.Object({
    sender: Type.String(),
    receiver: Type.String(),
    net_quantity: EosAsset,
    cpu_quantity: EosAsset,
});

export type EosActionRefund = Static<typeof EosActionRefund>;
export const EosActionRefund = Type.Object({
    owner: Type.String(),
});

export type EosActionBuyRam = Static<typeof EosActionBuyRam>;
export const EosActionBuyRam = Type.Object({
    payer: Type.String(),
    receiver: Type.String(),
    quantity: EosAsset,
});

export type EosActionBuyRamBytes = Static<typeof EosActionBuyRamBytes>;
export const EosActionBuyRamBytes = Type.Object({
    payer: Type.String(),
    receiver: Type.String(),
    bytes: Type.Number(),
});

export type EosActionSellRam = Static<typeof EosActionSellRam>;
export const EosActionSellRam = Type.Object({
    account: Type.String(),
    bytes: Type.Number(),
});

export type EosActionVoteProducer = Static<typeof EosActionVoteProducer>;
export const EosActionVoteProducer = Type.Object({
    voter: Type.String(),
    proxy: Type.String(),
    producers: Type.Array(Type.String()),
});

export type EosActionUpdateAuth = Static<typeof EosActionUpdateAuth>;
export const EosActionUpdateAuth = Type.Object({
    account: Type.String(),
    permission: Type.String(),
    parent: Type.String(),
    auth: EosAuthorization,
});

export type EosActionDeleteAuth = Static<typeof EosActionDeleteAuth>;
export const EosActionDeleteAuth = Type.Object({
    account: Type.String(),
    permission: Type.String(),
});

export type EosActionLinkAuth = Static<typeof EosActionLinkAuth>;
export const EosActionLinkAuth = Type.Object({
    account: Type.String(),
    code: Type.String(),
    type: Type.String(),
    requirement: Type.String(),
});

export type EosActionUnlinkAuth = Static<typeof EosActionUnlinkAuth>;
export const EosActionUnlinkAuth = Type.Object({
    account: Type.String(),
    code: Type.String(),
    type: Type.String(),
});

export type EosActionNewAccount = Static<typeof EosActionNewAccount>;
export const EosActionNewAccount = Type.Object({
    creator: Type.String(),
    name: Type.String(),
    owner: EosAuthorization,
    active: EosAuthorization,
});

export type EosActionUnknown = Static<typeof EosActionUnknown>;
export const EosActionUnknown = Type.Object({
    data_size: Type.Number(),
    data_chunk: Type.String(),
});

export type EosTxActionAck = Static<typeof EosTxActionAck>;
export const EosTxActionAck = Type.Object({
    common: EosActionCommon,
    transfer: Type.Optional(EosActionTransfer),
    delegate: Type.Optional(EosActionDelegate),
    undelegate: Type.Optional(EosActionUndelegate),
    refund: Type.Optional(EosActionRefund),
    buy_ram: Type.Optional(EosActionBuyRam),
    buy_ram_bytes: Type.Optional(EosActionBuyRamBytes),
    sell_ram: Type.Optional(EosActionSellRam),
    vote_producer: Type.Optional(EosActionVoteProducer),
    update_auth: Type.Optional(EosActionUpdateAuth),
    delete_auth: Type.Optional(EosActionDeleteAuth),
    link_auth: Type.Optional(EosActionLinkAuth),
    unlink_auth: Type.Optional(EosActionUnlinkAuth),
    new_account: Type.Optional(EosActionNewAccount),
    unknown: Type.Optional(EosActionUnknown),
});

export type EosSignedTx = Static<typeof EosSignedTx>;
export const EosSignedTx = Type.Object({
    signature: Type.String(),
});

export enum EthereumDefinitionType {
    NETWORK = 0,
    TOKEN = 1,
}

export type EnumEthereumDefinitionType = Static<typeof EnumEthereumDefinitionType>;
export const EnumEthereumDefinitionType = Type.Enum(EthereumDefinitionType);

export type EthereumNetworkInfo = Static<typeof EthereumNetworkInfo>;
export const EthereumNetworkInfo = Type.Object({
    chain_id: Type.Number(),
    symbol: Type.String(),
    slip44: Type.Number(),
    name: Type.String(),
});

export type EthereumTokenInfo = Static<typeof EthereumTokenInfo>;
export const EthereumTokenInfo = Type.Object({
    address: Type.String(),
    chain_id: Type.Number(),
    symbol: Type.String(),
    decimals: Type.Number(),
    name: Type.String(),
});

export type EthereumDefinitions = Static<typeof EthereumDefinitions>;
export const EthereumDefinitions = Type.Object({
    encoded_network: Type.Optional(Type.ArrayBuffer()),
    encoded_token: Type.Optional(Type.ArrayBuffer()),
});

export type EthereumSignTypedData = Static<typeof EthereumSignTypedData>;
export const EthereumSignTypedData = Type.Object({
    address_n: Type.Array(Type.Number()),
    primary_type: Type.String(),
    metamask_v4_compat: Type.Optional(Type.Boolean()),
    definitions: Type.Optional(EthereumDefinitions),
});

export type EthereumTypedDataStructRequest = Static<typeof EthereumTypedDataStructRequest>;
export const EthereumTypedDataStructRequest = Type.Object({
    name: Type.String(),
});

export enum EthereumDataType {
    UINT = 1,
    INT = 2,
    BYTES = 3,
    STRING = 4,
    BOOL = 5,
    ADDRESS = 6,
    ARRAY = 7,
    STRUCT = 8,
}

export type EnumEthereumDataType = Static<typeof EnumEthereumDataType>;
export const EnumEthereumDataType = Type.Enum(EthereumDataType);

export type EthereumFieldType = Static<typeof EthereumFieldType>;
export const EthereumFieldType = Type.Recursive(This =>
    Type.Object({
        data_type: EnumEthereumDataType,
        size: Type.Optional(Type.Number()),
        entry_type: Type.Optional(This),
        struct_name: Type.Optional(Type.String()),
    }),
);

export type EthereumStructMember = Static<typeof EthereumStructMember>;
export const EthereumStructMember = Type.Object({
    type: EthereumFieldType,
    name: Type.String(),
});

export type EthereumTypedDataStructAck = Static<typeof EthereumTypedDataStructAck>;
export const EthereumTypedDataStructAck = Type.Object({
    members: Type.Array(EthereumStructMember),
});

export type EthereumTypedDataValueRequest = Static<typeof EthereumTypedDataValueRequest>;
export const EthereumTypedDataValueRequest = Type.Object({
    member_path: Type.Array(Type.Number()),
});

export type EthereumTypedDataValueAck = Static<typeof EthereumTypedDataValueAck>;
export const EthereumTypedDataValueAck = Type.Object({
    value: Type.String(),
});

export type EthereumGetPublicKey = Static<typeof EthereumGetPublicKey>;
export const EthereumGetPublicKey = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
});

export type EthereumPublicKey = Static<typeof EthereumPublicKey>;
export const EthereumPublicKey = Type.Object({
    node: HDNodeType,
    xpub: Type.String(),
});

export type EthereumGetAddress = Static<typeof EthereumGetAddress>;
export const EthereumGetAddress = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    encoded_network: Type.Optional(Type.ArrayBuffer()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type EthereumAddress = Static<typeof EthereumAddress>;
export const EthereumAddress = Type.Object({
    _old_address: Type.Optional(Type.String()),
    address: Type.String(),
});

export type EthereumSignTx = Static<typeof EthereumSignTx>;
export const EthereumSignTx = Type.Object({
    address_n: Type.Array(Type.Number()),
    nonce: Type.Optional(Type.String()),
    gas_price: Type.String(),
    gas_limit: Type.String(),
    to: Type.Optional(Type.String()),
    value: Type.Optional(Type.String()),
    data_initial_chunk: Type.Optional(Type.String()),
    data_length: Type.Optional(Type.Number()),
    chain_id: Type.Number(),
    tx_type: Type.Optional(Type.Number()),
    definitions: Type.Optional(EthereumDefinitions),
    chunkify: Type.Optional(Type.Boolean()),
});

export type EthereumAccessList = Static<typeof EthereumAccessList>;
export const EthereumAccessList = Type.Object({
    address: Type.String(),
    storage_keys: Type.Array(Type.String()),
});

export type EthereumSignTxEIP1559 = Static<typeof EthereumSignTxEIP1559>;
export const EthereumSignTxEIP1559 = Type.Object({
    address_n: Type.Array(Type.Number()),
    nonce: Type.String(),
    max_gas_fee: Type.String(),
    max_priority_fee: Type.String(),
    gas_limit: Type.String(),
    to: Type.Optional(Type.String()),
    value: Type.String(),
    data_initial_chunk: Type.Optional(Type.String()),
    data_length: Type.Number(),
    chain_id: Type.Number(),
    access_list: Type.Array(EthereumAccessList),
    definitions: Type.Optional(EthereumDefinitions),
    chunkify: Type.Optional(Type.Boolean()),
});

export type EthereumTxRequest = Static<typeof EthereumTxRequest>;
export const EthereumTxRequest = Type.Object({
    data_length: Type.Optional(Type.Number()),
    signature_v: Type.Optional(Type.Number()),
    signature_r: Type.Optional(Type.String()),
    signature_s: Type.Optional(Type.String()),
});

export type EthereumTxAck = Static<typeof EthereumTxAck>;
export const EthereumTxAck = Type.Object({
    data_chunk: Type.String(),
});

export type EthereumSignMessage = Static<typeof EthereumSignMessage>;
export const EthereumSignMessage = Type.Object({
    address_n: Type.Array(Type.Number()),
    message: Type.String(),
    encoded_network: Type.Optional(Type.ArrayBuffer()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type EthereumMessageSignature = Static<typeof EthereumMessageSignature>;
export const EthereumMessageSignature = Type.Object({
    signature: Type.String(),
    address: Type.String(),
});

export type EthereumVerifyMessage = Static<typeof EthereumVerifyMessage>;
export const EthereumVerifyMessage = Type.Object({
    signature: Type.String(),
    message: Type.String(),
    address: Type.String(),
    chunkify: Type.Optional(Type.Boolean()),
});

export type EthereumSignTypedHash = Static<typeof EthereumSignTypedHash>;
export const EthereumSignTypedHash = Type.Object({
    address_n: Type.Array(Type.Number()),
    domain_separator_hash: Type.String(),
    message_hash: Type.Optional(Type.String()),
    encoded_network: Type.Optional(Type.ArrayBuffer()),
});

export type EthereumTypedDataSignature = Static<typeof EthereumTypedDataSignature>;
export const EthereumTypedDataSignature = Type.Object({
    signature: Type.String(),
    address: Type.String(),
});

export enum Enum_BackupType {
    Bip39 = 0,
    Slip39_Basic = 1,
    Slip39_Advanced = 2,
}

export type EnumEnum_BackupType = Static<typeof EnumEnum_BackupType>;
export const EnumEnum_BackupType = Type.Enum(Enum_BackupType);

export type BackupType = Static<typeof BackupType>;
export const BackupType = Type.KeyOfEnum(Enum_BackupType);

export enum Enum_SafetyCheckLevel {
    Strict = 0,
    PromptAlways = 1,
    PromptTemporarily = 2,
}

export type EnumEnum_SafetyCheckLevel = Static<typeof EnumEnum_SafetyCheckLevel>;
export const EnumEnum_SafetyCheckLevel = Type.Enum(Enum_SafetyCheckLevel);

export type SafetyCheckLevel = Static<typeof SafetyCheckLevel>;
export const SafetyCheckLevel = Type.KeyOfEnum(Enum_SafetyCheckLevel);

export enum Enum_HomescreenFormat {
    Toif = 1,
    Jpeg = 2,
    ToiG = 3,
}

export type EnumEnum_HomescreenFormat = Static<typeof EnumEnum_HomescreenFormat>;
export const EnumEnum_HomescreenFormat = Type.Enum(Enum_HomescreenFormat);

export type HomescreenFormat = Static<typeof HomescreenFormat>;
export const HomescreenFormat = Type.KeyOfEnum(Enum_HomescreenFormat);

export type Initialize = Static<typeof Initialize>;
export const Initialize = Type.Object({
    session_id: Type.Optional(Type.String()),
    _skip_passphrase: Type.Optional(Type.Boolean()),
    derive_cardano: Type.Optional(Type.Boolean()),
});

export type GetFeatures = Static<typeof GetFeatures>;
export const GetFeatures = Type.Object({});

export enum Enum_Capability {
    Capability_Bitcoin = 1,
    Capability_Bitcoin_like = 2,
    Capability_Binance = 3,
    Capability_Cardano = 4,
    Capability_Crypto = 5,
    Capability_EOS = 6,
    Capability_Ethereum = 7,
    Capability_Lisk = 8,
    Capability_Monero = 9,
    Capability_NEM = 10,
    Capability_Ripple = 11,
    Capability_Stellar = 12,
    Capability_Tezos = 13,
    Capability_U2F = 14,
    Capability_Shamir = 15,
    Capability_ShamirGroups = 16,
    Capability_PassphraseEntry = 17,
    Capability_Solana = 18,
}

export type EnumEnum_Capability = Static<typeof EnumEnum_Capability>;
export const EnumEnum_Capability = Type.Enum(Enum_Capability);

export type Capability = Static<typeof Capability>;
export const Capability = Type.KeyOfEnum(Enum_Capability);

export type Features = Static<typeof Features>;
export const Features = Type.Object({
    vendor: Type.String(),
    major_version: Type.Number(),
    minor_version: Type.Number(),
    patch_version: Type.Number(),
    bootloader_mode: Type.Union([Type.Boolean(), Type.Null()]),
    device_id: Type.Union([Type.String(), Type.Null()]),
    pin_protection: Type.Union([Type.Boolean(), Type.Null()]),
    passphrase_protection: Type.Union([Type.Boolean(), Type.Null()]),
    language: Type.Union([Type.String(), Type.Null()]),
    label: Type.Union([Type.String(), Type.Null()]),
    initialized: Type.Union([Type.Boolean(), Type.Null()]),
    revision: Type.Union([Type.String(), Type.Null()]),
    bootloader_hash: Type.Union([Type.String(), Type.Null()]),
    imported: Type.Union([Type.Boolean(), Type.Null()]),
    unlocked: Type.Union([Type.Boolean(), Type.Null()]),
    _passphrase_cached: Type.Optional(Type.Boolean()),
    firmware_present: Type.Union([Type.Boolean(), Type.Null()]),
    needs_backup: Type.Union([Type.Boolean(), Type.Null()]),
    flags: Type.Union([Type.Number(), Type.Null()]),
    model: Type.String(),
    fw_major: Type.Union([Type.Number(), Type.Null()]),
    fw_minor: Type.Union([Type.Number(), Type.Null()]),
    fw_patch: Type.Union([Type.Number(), Type.Null()]),
    fw_vendor: Type.Union([Type.String(), Type.Null()]),
    unfinished_backup: Type.Union([Type.Boolean(), Type.Null()]),
    no_backup: Type.Union([Type.Boolean(), Type.Null()]),
    recovery_mode: Type.Union([Type.Boolean(), Type.Null()]),
    capabilities: Type.Array(Capability),
    backup_type: Type.Union([BackupType, Type.Null()]),
    sd_card_present: Type.Union([Type.Boolean(), Type.Null()]),
    sd_protection: Type.Union([Type.Boolean(), Type.Null()]),
    wipe_code_protection: Type.Union([Type.Boolean(), Type.Null()]),
    session_id: Type.Union([Type.String(), Type.Null()]),
    passphrase_always_on_device: Type.Union([Type.Boolean(), Type.Null()]),
    safety_checks: Type.Union([SafetyCheckLevel, Type.Null()]),
    auto_lock_delay_ms: Type.Union([Type.Number(), Type.Null()]),
    display_rotation: Type.Union([Type.Number(), Type.Null()]),
    experimental_features: Type.Union([Type.Boolean(), Type.Null()]),
    busy: Type.Optional(Type.Boolean()),
    homescreen_format: Type.Optional(HomescreenFormat),
    hide_passphrase_from_host: Type.Optional(Type.Boolean()),
    internal_model: EnumDeviceModelInternal,
    unit_color: Type.Optional(Type.Number()),
    unit_btconly: Type.Optional(Type.Boolean()),
    homescreen_width: Type.Optional(Type.Number()),
    homescreen_height: Type.Optional(Type.Number()),
    bootloader_locked: Type.Optional(Type.Boolean()),
});

export type LockDevice = Static<typeof LockDevice>;
export const LockDevice = Type.Object({});

export type SetBusy = Static<typeof SetBusy>;
export const SetBusy = Type.Object({
    expiry_ms: Type.Optional(Type.Number()),
});

export type EndSession = Static<typeof EndSession>;
export const EndSession = Type.Object({});

export type ApplySettings = Static<typeof ApplySettings>;
export const ApplySettings = Type.Object({
    language: Type.Optional(Type.String()),
    label: Type.Optional(Type.String()),
    use_passphrase: Type.Optional(Type.Boolean()),
    homescreen: Type.Optional(Type.String()),
    _passphrase_source: Type.Optional(Type.Number()),
    auto_lock_delay_ms: Type.Optional(Type.Number()),
    display_rotation: Type.Optional(Type.Number()),
    passphrase_always_on_device: Type.Optional(Type.Boolean()),
    safety_checks: Type.Optional(SafetyCheckLevel),
    experimental_features: Type.Optional(Type.Boolean()),
    hide_passphrase_from_host: Type.Optional(Type.Boolean()),
});

export type ChangeLanguage = Static<typeof ChangeLanguage>;
export const ChangeLanguage = Type.Object({
    data_length: Type.Number(),
    show_display: Type.Optional(Type.Boolean()),
});

export type TranslationDataRequest = Static<typeof TranslationDataRequest>;
export const TranslationDataRequest = Type.Object({
    data_length: Type.Number(),
    data_offset: Type.Number(),
});

export type TranslationDataAck = Static<typeof TranslationDataAck>;
export const TranslationDataAck = Type.Object({
    data_chunk: Type.String(),
});

export type ApplyFlags = Static<typeof ApplyFlags>;
export const ApplyFlags = Type.Object({
    flags: Type.Number(),
});

export type ChangePin = Static<typeof ChangePin>;
export const ChangePin = Type.Object({
    remove: Type.Optional(Type.Boolean()),
});

export type ChangeWipeCode = Static<typeof ChangeWipeCode>;
export const ChangeWipeCode = Type.Object({
    remove: Type.Optional(Type.Boolean()),
});

export enum SdProtectOperationType {
    DISABLE = 0,
    ENABLE = 1,
    REFRESH = 2,
}

export type EnumSdProtectOperationType = Static<typeof EnumSdProtectOperationType>;
export const EnumSdProtectOperationType = Type.Enum(SdProtectOperationType);

export type SdProtect = Static<typeof SdProtect>;
export const SdProtect = Type.Object({
    operation: EnumSdProtectOperationType,
});

export type Ping = Static<typeof Ping>;
export const Ping = Type.Object({
    message: Type.Optional(Type.String()),
    button_protection: Type.Optional(Type.Boolean()),
});

export type Cancel = Static<typeof Cancel>;
export const Cancel = Type.Object({});

export type GetEntropy = Static<typeof GetEntropy>;
export const GetEntropy = Type.Object({
    size: Type.Number(),
});

export type Entropy = Static<typeof Entropy>;
export const Entropy = Type.Object({
    entropy: Type.String(),
});

export type GetFirmwareHash = Static<typeof GetFirmwareHash>;
export const GetFirmwareHash = Type.Object({
    challenge: Type.Optional(Type.String()),
});

export type FirmwareHash = Static<typeof FirmwareHash>;
export const FirmwareHash = Type.Object({
    hash: Type.String(),
});

export type AuthenticateDevice = Static<typeof AuthenticateDevice>;
export const AuthenticateDevice = Type.Object({
    challenge: Type.String(),
});

export type AuthenticityProof = Static<typeof AuthenticityProof>;
export const AuthenticityProof = Type.Object({
    certificates: Type.Array(Type.String()),
    signature: Type.String(),
});

export type WipeDevice = Static<typeof WipeDevice>;
export const WipeDevice = Type.Object({});

export type ResetDevice = Static<typeof ResetDevice>;
export const ResetDevice = Type.Object({
    display_random: Type.Optional(Type.Boolean()),
    strength: Type.Optional(Type.Number()),
    passphrase_protection: Type.Optional(Type.Boolean()),
    pin_protection: Type.Optional(Type.Boolean()),
    language: Type.Optional(Type.String()),
    label: Type.Optional(Type.String()),
    u2f_counter: Type.Optional(Type.Number()),
    skip_backup: Type.Optional(Type.Boolean()),
    no_backup: Type.Optional(Type.Boolean()),
    backup_type: Type.Optional(Type.Union([Type.String(), Type.Number()])),
});

export type BackupDevice = Static<typeof BackupDevice>;
export const BackupDevice = Type.Object({});

export type EntropyRequest = Static<typeof EntropyRequest>;
export const EntropyRequest = Type.Object({});

export type EntropyAck = Static<typeof EntropyAck>;
export const EntropyAck = Type.Object({
    entropy: Type.String(),
});

export enum RecoveryDeviceType {
    RecoveryDeviceType_ScrambledWords = 0,
    RecoveryDeviceType_Matrix = 1,
}

export type EnumRecoveryDeviceType = Static<typeof EnumRecoveryDeviceType>;
export const EnumRecoveryDeviceType = Type.Enum(RecoveryDeviceType);

export type RecoveryDevice = Static<typeof RecoveryDevice>;
export const RecoveryDevice = Type.Object({
    word_count: Type.Optional(Type.Number()),
    passphrase_protection: Type.Optional(Type.Boolean()),
    pin_protection: Type.Optional(Type.Boolean()),
    language: Type.Optional(Type.String()),
    label: Type.Optional(Type.String()),
    enforce_wordlist: Type.Optional(Type.Boolean()),
    type: Type.Optional(EnumRecoveryDeviceType),
    u2f_counter: Type.Optional(Type.Number()),
    dry_run: Type.Optional(Type.Boolean()),
});

export enum Enum_WordRequestType {
    WordRequestType_Plain = 0,
    WordRequestType_Matrix9 = 1,
    WordRequestType_Matrix6 = 2,
}

export type EnumEnum_WordRequestType = Static<typeof EnumEnum_WordRequestType>;
export const EnumEnum_WordRequestType = Type.Enum(Enum_WordRequestType);

export type WordRequestType = Static<typeof WordRequestType>;
export const WordRequestType = Type.KeyOfEnum(Enum_WordRequestType);

export type WordRequest = Static<typeof WordRequest>;
export const WordRequest = Type.Object({
    type: WordRequestType,
});

export type WordAck = Static<typeof WordAck>;
export const WordAck = Type.Object({
    word: Type.String(),
});

export type SetU2FCounter = Static<typeof SetU2FCounter>;
export const SetU2FCounter = Type.Object({
    u2f_counter: Type.Number(),
});

export type GetNextU2FCounter = Static<typeof GetNextU2FCounter>;
export const GetNextU2FCounter = Type.Object({});

export type NextU2FCounter = Static<typeof NextU2FCounter>;
export const NextU2FCounter = Type.Object({
    u2f_counter: Type.Number(),
});

export type DoPreauthorized = Static<typeof DoPreauthorized>;
export const DoPreauthorized = Type.Object({});

export type PreauthorizedRequest = Static<typeof PreauthorizedRequest>;
export const PreauthorizedRequest = Type.Object({});

export type CancelAuthorization = Static<typeof CancelAuthorization>;
export const CancelAuthorization = Type.Object({});

export enum BootCommand {
    STOP_AND_WAIT = 0,
    INSTALL_UPGRADE = 1,
}

export type EnumBootCommand = Static<typeof EnumBootCommand>;
export const EnumBootCommand = Type.Enum(BootCommand);

export type RebootToBootloader = Static<typeof RebootToBootloader>;
export const RebootToBootloader = Type.Object({
    boot_command: Type.Optional(EnumBootCommand),
    firmware_header: Type.Optional(Type.String()),
    language_data_length: Type.Optional(Type.Number()),
});

export type GetNonce = Static<typeof GetNonce>;
export const GetNonce = Type.Object({});

export type Nonce = Static<typeof Nonce>;
export const Nonce = Type.Object({
    nonce: Type.String(),
});

export type UnlockPath = Static<typeof UnlockPath>;
export const UnlockPath = Type.Object({
    address_n: Type.Array(Type.Number()),
    mac: Type.Optional(Type.String()),
});

export type UnlockedPathRequest = Static<typeof UnlockedPathRequest>;
export const UnlockedPathRequest = Type.Object({
    mac: Type.Optional(Type.String()),
});

export type ShowDeviceTutorial = Static<typeof ShowDeviceTutorial>;
export const ShowDeviceTutorial = Type.Object({});

export type UnlockBootloader = Static<typeof UnlockBootloader>;
export const UnlockBootloader = Type.Object({});

export enum MoneroNetworkType {
    MAINNET = 0,
    TESTNET = 1,
    STAGENET = 2,
    FAKECHAIN = 3,
}

export type EnumMoneroNetworkType = Static<typeof EnumMoneroNetworkType>;
export const EnumMoneroNetworkType = Type.Enum(MoneroNetworkType);

export type NEMGetAddress = Static<typeof NEMGetAddress>;
export const NEMGetAddress = Type.Object({
    address_n: Type.Array(Type.Number()),
    network: Type.Optional(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type NEMAddress = Static<typeof NEMAddress>;
export const NEMAddress = Type.Object({
    address: Type.String(),
});

export type NEMTransactionCommon = Static<typeof NEMTransactionCommon>;
export const NEMTransactionCommon = Type.Object({
    address_n: Type.Optional(Type.Array(Type.Number())),
    network: Type.Optional(Type.Number()),
    timestamp: Type.Number(),
    fee: Type.Uint(),
    deadline: Type.Number(),
    signer: Type.Optional(Type.String()),
});

export type NEMMosaic = Static<typeof NEMMosaic>;
export const NEMMosaic = Type.Object({
    namespace: Type.String(),
    mosaic: Type.String(),
    quantity: Type.Number(),
});

export type NEMTransfer = Static<typeof NEMTransfer>;
export const NEMTransfer = Type.Object({
    recipient: Type.String(),
    amount: Type.Uint(),
    payload: Type.Optional(Type.String()),
    public_key: Type.Optional(Type.String()),
    mosaics: Type.Optional(Type.Array(NEMMosaic)),
});

export type NEMProvisionNamespace = Static<typeof NEMProvisionNamespace>;
export const NEMProvisionNamespace = Type.Object({
    namespace: Type.String(),
    parent: Type.Optional(Type.String()),
    sink: Type.String(),
    fee: Type.Uint(),
});

export enum NEMMosaicLevy {
    MosaicLevy_Absolute = 1,
    MosaicLevy_Percentile = 2,
}

export type EnumNEMMosaicLevy = Static<typeof EnumNEMMosaicLevy>;
export const EnumNEMMosaicLevy = Type.Enum(NEMMosaicLevy);

export type NEMMosaicDefinition = Static<typeof NEMMosaicDefinition>;
export const NEMMosaicDefinition = Type.Object({
    name: Type.Optional(Type.String()),
    ticker: Type.Optional(Type.String()),
    namespace: Type.String(),
    mosaic: Type.String(),
    divisibility: Type.Optional(Type.Number()),
    levy: Type.Optional(EnumNEMMosaicLevy),
    fee: Type.Optional(Type.Uint()),
    levy_address: Type.Optional(Type.String()),
    levy_namespace: Type.Optional(Type.String()),
    levy_mosaic: Type.Optional(Type.String()),
    supply: Type.Optional(Type.Number()),
    mutable_supply: Type.Optional(Type.Boolean()),
    transferable: Type.Optional(Type.Boolean()),
    description: Type.String(),
    networks: Type.Optional(Type.Array(Type.Number())),
});

export type NEMMosaicCreation = Static<typeof NEMMosaicCreation>;
export const NEMMosaicCreation = Type.Object({
    definition: NEMMosaicDefinition,
    sink: Type.String(),
    fee: Type.Uint(),
});

export enum NEMSupplyChangeType {
    SupplyChange_Increase = 1,
    SupplyChange_Decrease = 2,
}

export type EnumNEMSupplyChangeType = Static<typeof EnumNEMSupplyChangeType>;
export const EnumNEMSupplyChangeType = Type.Enum(NEMSupplyChangeType);

export type NEMMosaicSupplyChange = Static<typeof NEMMosaicSupplyChange>;
export const NEMMosaicSupplyChange = Type.Object({
    namespace: Type.String(),
    mosaic: Type.String(),
    type: EnumNEMSupplyChangeType,
    delta: Type.Number(),
});

export enum NEMModificationType {
    CosignatoryModification_Add = 1,
    CosignatoryModification_Delete = 2,
}

export type EnumNEMModificationType = Static<typeof EnumNEMModificationType>;
export const EnumNEMModificationType = Type.Enum(NEMModificationType);

export type NEMCosignatoryModification = Static<typeof NEMCosignatoryModification>;
export const NEMCosignatoryModification = Type.Object({
    type: EnumNEMModificationType,
    public_key: Type.String(),
});

export type NEMAggregateModification = Static<typeof NEMAggregateModification>;
export const NEMAggregateModification = Type.Object({
    modifications: Type.Optional(Type.Array(NEMCosignatoryModification)),
    relative_change: Type.Optional(Type.Number()),
});

export enum NEMImportanceTransferMode {
    ImportanceTransfer_Activate = 1,
    ImportanceTransfer_Deactivate = 2,
}

export type EnumNEMImportanceTransferMode = Static<typeof EnumNEMImportanceTransferMode>;
export const EnumNEMImportanceTransferMode = Type.Enum(NEMImportanceTransferMode);

export type NEMImportanceTransfer = Static<typeof NEMImportanceTransfer>;
export const NEMImportanceTransfer = Type.Object({
    mode: EnumNEMImportanceTransferMode,
    public_key: Type.String(),
});

export type NEMSignTx = Static<typeof NEMSignTx>;
export const NEMSignTx = Type.Object({
    transaction: NEMTransactionCommon,
    multisig: Type.Optional(NEMTransactionCommon),
    transfer: Type.Optional(NEMTransfer),
    cosigning: Type.Optional(Type.Boolean()),
    provision_namespace: Type.Optional(NEMProvisionNamespace),
    mosaic_creation: Type.Optional(NEMMosaicCreation),
    supply_change: Type.Optional(NEMMosaicSupplyChange),
    aggregate_modification: Type.Optional(NEMAggregateModification),
    importance_transfer: Type.Optional(NEMImportanceTransfer),
    chunkify: Type.Optional(Type.Boolean()),
});

export type NEMSignedTx = Static<typeof NEMSignedTx>;
export const NEMSignedTx = Type.Object({
    data: Type.String(),
    signature: Type.String(),
});

export type NEMDecryptMessage = Static<typeof NEMDecryptMessage>;
export const NEMDecryptMessage = Type.Object({
    address_n: Type.Array(Type.Number()),
    network: Type.Optional(Type.Number()),
    public_key: Type.Optional(Type.String()),
    payload: Type.Optional(Type.String()),
});

export type NEMDecryptedMessage = Static<typeof NEMDecryptedMessage>;
export const NEMDecryptedMessage = Type.Object({
    payload: Type.String(),
});

export type RippleGetAddress = Static<typeof RippleGetAddress>;
export const RippleGetAddress = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type RippleAddress = Static<typeof RippleAddress>;
export const RippleAddress = Type.Object({
    address: Type.String(),
});

export type RipplePayment = Static<typeof RipplePayment>;
export const RipplePayment = Type.Object({
    amount: Type.Uint(),
    destination: Type.String(),
    destination_tag: Type.Optional(Type.Number()),
});

export type RippleSignTx = Static<typeof RippleSignTx>;
export const RippleSignTx = Type.Object({
    address_n: Type.Array(Type.Number()),
    fee: Type.Uint(),
    flags: Type.Optional(Type.Number()),
    sequence: Type.Number(),
    last_ledger_sequence: Type.Optional(Type.Number()),
    payment: RipplePayment,
    chunkify: Type.Optional(Type.Boolean()),
});

export type RippleSignedTx = Static<typeof RippleSignedTx>;
export const RippleSignedTx = Type.Object({
    signature: Type.String(),
    serialized_tx: Type.String(),
});

export type SolanaGetPublicKey = Static<typeof SolanaGetPublicKey>;
export const SolanaGetPublicKey = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
});

export type SolanaPublicKey = Static<typeof SolanaPublicKey>;
export const SolanaPublicKey = Type.Object({
    public_key: Type.String(),
});

export type SolanaGetAddress = Static<typeof SolanaGetAddress>;
export const SolanaGetAddress = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type SolanaAddress = Static<typeof SolanaAddress>;
export const SolanaAddress = Type.Object({
    address: Type.String(),
});

export type SolanaTxTokenAccountInfo = Static<typeof SolanaTxTokenAccountInfo>;
export const SolanaTxTokenAccountInfo = Type.Object({
    base_address: Type.String(),
    token_program: Type.String(),
    token_mint: Type.String(),
    token_account: Type.String(),
});

export type SolanaTxAdditionalInfo = Static<typeof SolanaTxAdditionalInfo>;
export const SolanaTxAdditionalInfo = Type.Object({
    token_accounts_infos: Type.Array(SolanaTxTokenAccountInfo),
});

export type SolanaSignTx = Static<typeof SolanaSignTx>;
export const SolanaSignTx = Type.Object({
    address_n: Type.Array(Type.Number()),
    serialized_tx: Type.String(),
    additional_info: Type.Optional(SolanaTxAdditionalInfo),
});

export type SolanaTxSignature = Static<typeof SolanaTxSignature>;
export const SolanaTxSignature = Type.Object({
    signature: Type.String(),
});

export enum StellarAssetType {
    NATIVE = 0,
    ALPHANUM4 = 1,
    ALPHANUM12 = 2,
}

export type EnumStellarAssetType = Static<typeof EnumStellarAssetType>;
export const EnumStellarAssetType = Type.Enum(StellarAssetType);

export type StellarAsset = Static<typeof StellarAsset>;
export const StellarAsset = Type.Object({
    type: Type.Union([
        Type.Literal(0),
        Type.Literal(1),
        Type.Literal(2),
        Type.Literal('NATIVE'),
        Type.Literal('ALPHANUM4'),
        Type.Literal('ALPHANUM12'),
    ]),
    code: Type.Optional(Type.String()),
    issuer: Type.Optional(Type.String()),
});

export type StellarGetAddress = Static<typeof StellarGetAddress>;
export const StellarGetAddress = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type StellarAddress = Static<typeof StellarAddress>;
export const StellarAddress = Type.Object({
    address: Type.String(),
});

export enum StellarMemoType {
    NONE = 0,
    TEXT = 1,
    ID = 2,
    HASH = 3,
    RETURN = 4,
}

export type EnumStellarMemoType = Static<typeof EnumStellarMemoType>;
export const EnumStellarMemoType = Type.Enum(StellarMemoType);

export type StellarSignTx = Static<typeof StellarSignTx>;
export const StellarSignTx = Type.Object({
    address_n: Type.Array(Type.Number()),
    network_passphrase: Type.String(),
    source_account: Type.String(),
    fee: Type.Uint(),
    sequence_number: Type.Uint(),
    timebounds_start: Type.Number(),
    timebounds_end: Type.Number(),
    memo_type: EnumStellarMemoType,
    memo_text: Type.Optional(Type.String()),
    memo_id: Type.Optional(Type.Uint()),
    memo_hash: Type.Optional(Type.Union([Type.Buffer(), Type.String()])),
    num_operations: Type.Number(),
});

export type StellarTxOpRequest = Static<typeof StellarTxOpRequest>;
export const StellarTxOpRequest = Type.Object({});

export type StellarPaymentOp = Static<typeof StellarPaymentOp>;
export const StellarPaymentOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    destination_account: Type.String(),
    asset: StellarAsset,
    amount: Type.Uint(),
});

export type StellarCreateAccountOp = Static<typeof StellarCreateAccountOp>;
export const StellarCreateAccountOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    new_account: Type.String(),
    starting_balance: Type.Uint(),
});

export type StellarPathPaymentStrictReceiveOp = Static<typeof StellarPathPaymentStrictReceiveOp>;
export const StellarPathPaymentStrictReceiveOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    send_asset: StellarAsset,
    send_max: Type.Uint(),
    destination_account: Type.String(),
    destination_asset: StellarAsset,
    destination_amount: Type.Uint(),
    paths: Type.Optional(Type.Array(StellarAsset)),
});

export type StellarPathPaymentStrictSendOp = Static<typeof StellarPathPaymentStrictSendOp>;
export const StellarPathPaymentStrictSendOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    send_asset: StellarAsset,
    send_amount: Type.Uint(),
    destination_account: Type.String(),
    destination_asset: StellarAsset,
    destination_min: Type.Uint(),
    paths: Type.Optional(Type.Array(StellarAsset)),
});

export type StellarManageSellOfferOp = Static<typeof StellarManageSellOfferOp>;
export const StellarManageSellOfferOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    selling_asset: StellarAsset,
    buying_asset: StellarAsset,
    amount: Type.Uint(),
    price_n: Type.Number(),
    price_d: Type.Number(),
    offer_id: Type.Uint(),
});

export type StellarManageBuyOfferOp = Static<typeof StellarManageBuyOfferOp>;
export const StellarManageBuyOfferOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    selling_asset: StellarAsset,
    buying_asset: StellarAsset,
    amount: Type.Uint(),
    price_n: Type.Number(),
    price_d: Type.Number(),
    offer_id: Type.Uint(),
});

export type StellarCreatePassiveSellOfferOp = Static<typeof StellarCreatePassiveSellOfferOp>;
export const StellarCreatePassiveSellOfferOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    selling_asset: StellarAsset,
    buying_asset: StellarAsset,
    amount: Type.Uint(),
    price_n: Type.Number(),
    price_d: Type.Number(),
});

export enum StellarSignerType {
    ACCOUNT = 0,
    PRE_AUTH = 1,
    HASH = 2,
}

export type EnumStellarSignerType = Static<typeof EnumStellarSignerType>;
export const EnumStellarSignerType = Type.Enum(StellarSignerType);

export type StellarSetOptionsOp = Static<typeof StellarSetOptionsOp>;
export const StellarSetOptionsOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    inflation_destination_account: Type.Optional(Type.String()),
    clear_flags: Type.Optional(Type.Number()),
    set_flags: Type.Optional(Type.Number()),
    master_weight: Type.Optional(Type.Uint()),
    low_threshold: Type.Optional(Type.Uint()),
    medium_threshold: Type.Optional(Type.Uint()),
    high_threshold: Type.Optional(Type.Uint()),
    home_domain: Type.Optional(Type.String()),
    signer_type: Type.Optional(EnumStellarSignerType),
    signer_key: Type.Optional(Type.Union([Type.Buffer(), Type.String()])),
    signer_weight: Type.Optional(Type.Number()),
});

export type StellarChangeTrustOp = Static<typeof StellarChangeTrustOp>;
export const StellarChangeTrustOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    asset: StellarAsset,
    limit: Type.Uint(),
});

export type StellarAllowTrustOp = Static<typeof StellarAllowTrustOp>;
export const StellarAllowTrustOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    trusted_account: Type.String(),
    asset_type: EnumStellarAssetType,
    asset_code: Type.Optional(Type.String()),
    is_authorized: Type.Boolean(),
});

export type StellarAccountMergeOp = Static<typeof StellarAccountMergeOp>;
export const StellarAccountMergeOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    destination_account: Type.String(),
});

export type StellarManageDataOp = Static<typeof StellarManageDataOp>;
export const StellarManageDataOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    key: Type.String(),
    value: Type.Optional(Type.Union([Type.Buffer(), Type.String()])),
});

export type StellarBumpSequenceOp = Static<typeof StellarBumpSequenceOp>;
export const StellarBumpSequenceOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    bump_to: Type.Uint(),
});

export type StellarClaimClaimableBalanceOp = Static<typeof StellarClaimClaimableBalanceOp>;
export const StellarClaimClaimableBalanceOp = Type.Object({
    source_account: Type.Optional(Type.String()),
    balance_id: Type.String(),
});

export type StellarSignedTx = Static<typeof StellarSignedTx>;
export const StellarSignedTx = Type.Object({
    public_key: Type.String(),
    signature: Type.String(),
});

export type TezosGetAddress = Static<typeof TezosGetAddress>;
export const TezosGetAddress = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type TezosAddress = Static<typeof TezosAddress>;
export const TezosAddress = Type.Object({
    address: Type.String(),
});

export type TezosGetPublicKey = Static<typeof TezosGetPublicKey>;
export const TezosGetPublicKey = Type.Object({
    address_n: Type.Array(Type.Number()),
    show_display: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type TezosPublicKey = Static<typeof TezosPublicKey>;
export const TezosPublicKey = Type.Object({
    public_key: Type.String(),
});

export enum TezosContractType {
    Implicit = 0,
    Originated = 1,
}

export type EnumTezosContractType = Static<typeof EnumTezosContractType>;
export const EnumTezosContractType = Type.Enum(TezosContractType);

export type TezosContractID = Static<typeof TezosContractID>;
export const TezosContractID = Type.Object({
    tag: Type.Number(),
    hash: Type.Uint8Array(),
});

export type TezosRevealOp = Static<typeof TezosRevealOp>;
export const TezosRevealOp = Type.Object({
    source: Type.Uint8Array(),
    fee: Type.Uint(),
    counter: Type.Number(),
    gas_limit: Type.Number(),
    storage_limit: Type.Number(),
    public_key: Type.Uint8Array(),
});

export type TezosManagerTransfer = Static<typeof TezosManagerTransfer>;
export const TezosManagerTransfer = Type.Object({
    destination: TezosContractID,
    amount: Type.Uint(),
});

export type TezosParametersManager = Static<typeof TezosParametersManager>;
export const TezosParametersManager = Type.Object({
    set_delegate: Type.Optional(Type.Uint8Array()),
    cancel_delegate: Type.Optional(Type.Boolean()),
    transfer: Type.Optional(TezosManagerTransfer),
});

export type TezosTransactionOp = Static<typeof TezosTransactionOp>;
export const TezosTransactionOp = Type.Object({
    source: Type.Uint8Array(),
    fee: Type.Uint(),
    counter: Type.Number(),
    gas_limit: Type.Number(),
    storage_limit: Type.Number(),
    amount: Type.Uint(),
    destination: TezosContractID,
    parameters: Type.Optional(Type.Array(Type.Number())),
    parameters_manager: Type.Optional(TezosParametersManager),
});

export type TezosOriginationOp = Static<typeof TezosOriginationOp>;
export const TezosOriginationOp = Type.Object({
    source: Type.Uint8Array(),
    fee: Type.Uint(),
    counter: Type.Number(),
    gas_limit: Type.Number(),
    storage_limit: Type.Number(),
    manager_pubkey: Type.Optional(Type.String()),
    balance: Type.Number(),
    spendable: Type.Optional(Type.Boolean()),
    delegatable: Type.Optional(Type.Boolean()),
    delegate: Type.Optional(Type.Uint8Array()),
    script: Type.Union([Type.String(), Type.Array(Type.Number())]),
});

export type TezosDelegationOp = Static<typeof TezosDelegationOp>;
export const TezosDelegationOp = Type.Object({
    source: Type.Uint8Array(),
    fee: Type.Uint(),
    counter: Type.Number(),
    gas_limit: Type.Number(),
    storage_limit: Type.Number(),
    delegate: Type.Uint8Array(),
});

export type TezosProposalOp = Static<typeof TezosProposalOp>;
export const TezosProposalOp = Type.Object({
    source: Type.String(),
    period: Type.Number(),
    proposals: Type.Array(Type.String()),
});

export enum TezosBallotType {
    Yay = 0,
    Nay = 1,
    Pass = 2,
}

export type EnumTezosBallotType = Static<typeof EnumTezosBallotType>;
export const EnumTezosBallotType = Type.Enum(TezosBallotType);

export type TezosBallotOp = Static<typeof TezosBallotOp>;
export const TezosBallotOp = Type.Object({
    source: Type.String(),
    period: Type.Number(),
    proposal: Type.String(),
    ballot: EnumTezosBallotType,
});

export type TezosSignTx = Static<typeof TezosSignTx>;
export const TezosSignTx = Type.Object({
    address_n: Type.Array(Type.Number()),
    branch: Type.Uint8Array(),
    reveal: Type.Optional(TezosRevealOp),
    transaction: Type.Optional(TezosTransactionOp),
    origination: Type.Optional(TezosOriginationOp),
    delegation: Type.Optional(TezosDelegationOp),
    proposal: Type.Optional(TezosProposalOp),
    ballot: Type.Optional(TezosBallotOp),
    chunkify: Type.Optional(Type.Boolean()),
});

export type TezosSignedTx = Static<typeof TezosSignedTx>;
export const TezosSignedTx = Type.Object({
    signature: Type.String(),
    sig_op_contents: Type.String(),
    operation_hash: Type.String(),
});

export type experimental_message = Static<typeof experimental_message>;
export const experimental_message = Type.Object({});

export type experimental_field = Static<typeof experimental_field>;
export const experimental_field = Type.Object({});

export type MessageType = Static<typeof MessageType>;
export const MessageType = Type.Object({
    BinanceGetAddress,
    BinanceAddress,
    BinanceGetPublicKey,
    BinancePublicKey,
    BinanceSignTx,
    BinanceTxRequest,
    BinanceCoin,
    BinanceInputOutput,
    BinanceTransferMsg,
    BinanceOrderMsg,
    BinanceCancelMsg,
    BinanceSignedTx,
    HDNodeType,
    HDNodePathType,
    MultisigRedeemScriptType,
    GetPublicKey,
    PublicKey,
    GetAddress,
    Address,
    GetOwnershipId,
    OwnershipId,
    SignMessage,
    MessageSignature,
    VerifyMessage,
    CoinJoinRequest,
    SignTx,
    TxRequestDetailsType,
    TxRequestSerializedType,
    TxRequest,
    TxInputType,
    TxOutputBinType,
    TxOutputType,
    PrevTx,
    PrevInput,
    PrevOutput,
    TextMemo,
    RefundMemo,
    CoinPurchaseMemo,
    PaymentRequestMemo,
    TxAckPaymentRequest,
    TxAck,
    TxAckInputWrapper,
    TxAckInput,
    TxAckOutputWrapper,
    TxAckOutput,
    TxAckPrevMeta,
    TxAckPrevInputWrapper,
    TxAckPrevInput,
    TxAckPrevOutputWrapper,
    TxAckPrevOutput,
    TxAckPrevExtraDataWrapper,
    TxAckPrevExtraData,
    GetOwnershipProof,
    OwnershipProof,
    AuthorizeCoinJoin,
    FirmwareErase,
    FirmwareRequest,
    FirmwareUpload,
    SelfTest,
    CardanoBlockchainPointerType,
    CardanoNativeScript,
    CardanoGetNativeScriptHash,
    CardanoNativeScriptHash,
    CardanoAddressParametersType,
    CardanoGetAddress,
    CardanoAddress,
    CardanoGetPublicKey,
    CardanoPublicKey,
    CardanoSignTxInit,
    CardanoTxInput,
    CardanoTxOutput,
    CardanoAssetGroup,
    CardanoToken,
    CardanoTxInlineDatumChunk,
    CardanoTxReferenceScriptChunk,
    CardanoPoolOwner,
    CardanoPoolRelayParameters,
    CardanoPoolMetadataType,
    CardanoPoolParametersType,
    CardanoTxCertificate,
    CardanoTxWithdrawal,
    CardanoCVoteRegistrationDelegation,
    CardanoCVoteRegistrationParametersType,
    CardanoTxAuxiliaryData,
    CardanoTxMint,
    CardanoTxCollateralInput,
    CardanoTxRequiredSigner,
    CardanoTxReferenceInput,
    CardanoTxItemAck,
    CardanoTxAuxiliaryDataSupplement,
    CardanoTxWitnessRequest,
    CardanoTxWitnessResponse,
    CardanoTxHostAck,
    CardanoTxBodyHash,
    CardanoSignTxFinished,
    Success,
    Failure,
    ButtonRequest,
    ButtonAck,
    PinMatrixRequest,
    PinMatrixAck,
    PassphraseRequest,
    PassphraseAck,
    Deprecated_PassphraseStateRequest,
    Deprecated_PassphraseStateAck,
    CipherKeyValue,
    CipheredKeyValue,
    IdentityType,
    SignIdentity,
    SignedIdentity,
    GetECDHSessionKey,
    ECDHSessionKey,
    DebugLinkResetDebugEvents,
    EosGetPublicKey,
    EosPublicKey,
    EosTxHeader,
    EosSignTx,
    EosTxActionRequest,
    EosAsset,
    EosPermissionLevel,
    EosAuthorizationKey,
    EosAuthorizationAccount,
    EosAuthorizationWait,
    EosAuthorization,
    EosActionCommon,
    EosActionTransfer,
    EosActionDelegate,
    EosActionUndelegate,
    EosActionRefund,
    EosActionBuyRam,
    EosActionBuyRamBytes,
    EosActionSellRam,
    EosActionVoteProducer,
    EosActionUpdateAuth,
    EosActionDeleteAuth,
    EosActionLinkAuth,
    EosActionUnlinkAuth,
    EosActionNewAccount,
    EosActionUnknown,
    EosTxActionAck,
    EosSignedTx,
    EthereumNetworkInfo,
    EthereumTokenInfo,
    EthereumDefinitions,
    EthereumSignTypedData,
    EthereumTypedDataStructRequest,
    EthereumFieldType,
    EthereumStructMember,
    EthereumTypedDataStructAck,
    EthereumTypedDataValueRequest,
    EthereumTypedDataValueAck,
    EthereumGetPublicKey,
    EthereumPublicKey,
    EthereumGetAddress,
    EthereumAddress,
    EthereumSignTx,
    EthereumAccessList,
    EthereumSignTxEIP1559,
    EthereumTxRequest,
    EthereumTxAck,
    EthereumSignMessage,
    EthereumMessageSignature,
    EthereumVerifyMessage,
    EthereumSignTypedHash,
    EthereumTypedDataSignature,
    Initialize,
    GetFeatures,
    Features,
    LockDevice,
    SetBusy,
    EndSession,
    ApplySettings,
    ChangeLanguage,
    TranslationDataRequest,
    TranslationDataAck,
    ApplyFlags,
    ChangePin,
    ChangeWipeCode,
    SdProtect,
    Ping,
    Cancel,
    GetEntropy,
    Entropy,
    GetFirmwareHash,
    FirmwareHash,
    AuthenticateDevice,
    AuthenticityProof,
    WipeDevice,
    ResetDevice,
    BackupDevice,
    EntropyRequest,
    EntropyAck,
    RecoveryDevice,
    WordRequest,
    WordAck,
    SetU2FCounter,
    GetNextU2FCounter,
    NextU2FCounter,
    DoPreauthorized,
    PreauthorizedRequest,
    CancelAuthorization,
    RebootToBootloader,
    GetNonce,
    Nonce,
    UnlockPath,
    UnlockedPathRequest,
    ShowDeviceTutorial,
    UnlockBootloader,
    NEMGetAddress,
    NEMAddress,
    NEMTransactionCommon,
    NEMMosaic,
    NEMTransfer,
    NEMProvisionNamespace,
    NEMMosaicDefinition,
    NEMMosaicCreation,
    NEMMosaicSupplyChange,
    NEMCosignatoryModification,
    NEMAggregateModification,
    NEMImportanceTransfer,
    NEMSignTx,
    NEMSignedTx,
    NEMDecryptMessage,
    NEMDecryptedMessage,
    RippleGetAddress,
    RippleAddress,
    RipplePayment,
    RippleSignTx,
    RippleSignedTx,
    SolanaGetPublicKey,
    SolanaPublicKey,
    SolanaGetAddress,
    SolanaAddress,
    SolanaTxTokenAccountInfo,
    SolanaTxAdditionalInfo,
    SolanaSignTx,
    SolanaTxSignature,
    StellarAsset,
    StellarGetAddress,
    StellarAddress,
    StellarSignTx,
    StellarTxOpRequest,
    StellarPaymentOp,
    StellarCreateAccountOp,
    StellarPathPaymentStrictReceiveOp,
    StellarPathPaymentStrictSendOp,
    StellarManageSellOfferOp,
    StellarManageBuyOfferOp,
    StellarCreatePassiveSellOfferOp,
    StellarSetOptionsOp,
    StellarChangeTrustOp,
    StellarAllowTrustOp,
    StellarAccountMergeOp,
    StellarManageDataOp,
    StellarBumpSequenceOp,
    StellarClaimClaimableBalanceOp,
    StellarSignedTx,
    TezosGetAddress,
    TezosAddress,
    TezosGetPublicKey,
    TezosPublicKey,
    TezosContractID,
    TezosRevealOp,
    TezosManagerTransfer,
    TezosParametersManager,
    TezosTransactionOp,
    TezosOriginationOp,
    TezosDelegationOp,
    TezosProposalOp,
    TezosBallotOp,
    TezosSignTx,
    TezosSignedTx,
    experimental_message,
    experimental_field,
});

// custom type uint32/64 may be represented as string
export type UintType = string | number;

export type MessageKey = keyof MessageType;

export type MessageResponse<T extends MessageKey> = {
    type: T;
    message: MessageType[T];
};

export type TypedCall = <T extends MessageKey, R extends MessageKey>(
    type: T,
    resType: R,
    message?: MessageType[T],
) => Promise<MessageResponse<R>>;
