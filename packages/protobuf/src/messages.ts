// This file is auto generated from data/messages/message.json

// custom type uint32/64 may be represented as string
export type UintType = string | number;

// custom type sint32/64
export type SintType = string | number;

export enum DeviceModelInternal {
    T1B1 = 'T1B1',
    T2T1 = 'T2T1',
    T2B1 = 'T2B1',
}

// BinanceGetAddress
export type BinanceGetAddress = {
    address_n: number[];
    show_display?: boolean;
    chunkify?: boolean;
};

// BinanceAddress
export type BinanceAddress = {
    address: string;
};

// BinanceGetPublicKey
export type BinanceGetPublicKey = {
    address_n: number[];
    show_display?: boolean;
};

// BinancePublicKey
export type BinancePublicKey = {
    public_key: string;
};

// BinanceSignTx
export type BinanceSignTx = {
    address_n: number[];
    msg_count: number;
    account_number: number;
    chain_id?: string;
    memo?: string;
    sequence: number;
    source: number;
    chunkify?: boolean;
};

// BinanceTxRequest
export type BinanceTxRequest = {};

export type BinanceCoin = {
    amount: UintType;
    denom: string;
};

export type BinanceInputOutput = {
    address: string;
    coins: BinanceCoin[];
};

// BinanceTransferMsg
export type BinanceTransferMsg = {
    inputs: BinanceInputOutput[];
    outputs: BinanceInputOutput[];
    chunkify?: boolean;
};

export enum BinanceOrderType {
    OT_UNKNOWN = 0,
    MARKET = 1,
    LIMIT = 2,
    OT_RESERVED = 3,
}

export enum BinanceOrderSide {
    SIDE_UNKNOWN = 0,
    BUY = 1,
    SELL = 2,
}

export enum BinanceTimeInForce {
    TIF_UNKNOWN = 0,
    GTE = 1,
    TIF_RESERVED = 2,
    IOC = 3,
}

// BinanceOrderMsg
export type BinanceOrderMsg = {
    id?: string;
    ordertype: BinanceOrderType;
    price: number;
    quantity: number;
    sender?: string;
    side: BinanceOrderSide;
    symbol?: string;
    timeinforce: BinanceTimeInForce;
};

// BinanceCancelMsg
export type BinanceCancelMsg = {
    refid?: string;
    sender?: string;
    symbol?: string;
};

// BinanceSignedTx
export type BinanceSignedTx = {
    signature: string;
    public_key: string;
};

export enum Enum_InputScriptType {
    SPENDADDRESS = 0,
    SPENDMULTISIG = 1,
    EXTERNAL = 2,
    SPENDWITNESS = 3,
    SPENDP2SHWITNESS = 4,
    SPENDTAPROOT = 5,
}

export type InputScriptType = keyof typeof Enum_InputScriptType;

export enum Enum_OutputScriptType {
    PAYTOADDRESS = 0,
    PAYTOSCRIPTHASH = 1,
    PAYTOMULTISIG = 2,
    PAYTOOPRETURN = 3,
    PAYTOWITNESS = 4,
    PAYTOP2SHWITNESS = 5,
    PAYTOTAPROOT = 6,
}

export type OutputScriptType = keyof typeof Enum_OutputScriptType;

export enum DecredStakingSpendType {
    SSGen = 0,
    SSRTX = 1,
}

export enum AmountUnit {
    BITCOIN = 0,
    MILLIBITCOIN = 1,
    MICROBITCOIN = 2,
    SATOSHI = 3,
}

// HDNodeType
export type HDNodeType = {
    depth: number;
    fingerprint: number;
    child_num: number;
    chain_code: string;
    private_key?: string;
    public_key: string;
};

export type HDNodePathType = {
    node: HDNodeType | string;
    address_n: number[];
};

// MultisigRedeemScriptType
export type MultisigRedeemScriptType = {
    pubkeys: HDNodePathType[];
    signatures: string[];
    m: number;
    nodes?: HDNodeType[];
    address_n?: number[];
};

// GetPublicKey
export type GetPublicKey = {
    address_n: number[];
    ecdsa_curve_name?: string;
    show_display?: boolean;
    coin_name?: string;
    script_type?: InputScriptType;
    ignore_xpub_magic?: boolean;
};

// PublicKey
export type PublicKey = {
    node: HDNodeType;
    xpub: string;
    root_fingerprint?: number;
};

// GetAddress
export type GetAddress = {
    address_n: number[];
    coin_name?: string;
    show_display?: boolean;
    multisig?: MultisigRedeemScriptType;
    script_type?: InputScriptType;
    ignore_xpub_magic?: boolean;
    chunkify?: boolean;
};

// Address
export type Address = {
    address: string;
    mac?: string;
};

// GetOwnershipId
export type GetOwnershipId = {
    address_n: number[];
    coin_name?: string;
    multisig?: MultisigRedeemScriptType;
    script_type?: InputScriptType;
};

// OwnershipId
export type OwnershipId = {
    ownership_id: string;
};

// SignMessage
export type SignMessage = {
    address_n: number[];
    message: string;
    coin_name?: string;
    script_type?: InputScriptType;
    no_script_type?: boolean;
    chunkify?: boolean;
};

// MessageSignature
export type MessageSignature = {
    address: string;
    signature: string;
};

// VerifyMessage
export type VerifyMessage = {
    address: string;
    signature: string;
    message: string;
    coin_name?: string;
    chunkify?: boolean;
};

export type CoinJoinRequest = {
    fee_rate: number;
    no_fee_threshold: number;
    min_registrable_amount: number;
    mask_public_key: string;
    signature: string;
};

// SignTx
export type SignTx = {
    outputs_count: number;
    inputs_count: number;
    coin_name?: string;
    version?: number;
    lock_time?: number;
    expiry?: number;
    overwintered?: boolean;
    version_group_id?: number;
    timestamp?: number;
    branch_id?: number;
    amount_unit?: AmountUnit;
    decred_staking_ticket?: boolean;
    serialize?: boolean;
    coinjoin_request?: CoinJoinRequest;
    chunkify?: boolean;
};

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

export type RequestType = keyof typeof Enum_RequestType;

export type TxRequestDetailsType = {
    request_index: number;
    tx_hash?: string;
    extra_data_len?: number;
    extra_data_offset?: number;
};

export type TxRequestSerializedType = {
    signature_index?: number;
    signature?: string;
    serialized_tx?: string;
};

// TxRequest
export type TxRequest = {
    request_type: RequestType;
    details: TxRequestDetailsType;
    serialized?: TxRequestSerializedType;
};

// TxInputType replacement
// TxInputType needs more exact types
// differences: external input (no address_n + required script_pubkey)

export type InternalInputScriptType = Exclude<InputScriptType, 'EXTERNAL'>;

type CommonTxInputType = {
    prev_hash: string; // required: previous transaction hash (reversed)
    prev_index: number; // required: previous transaction index
    amount: UintType; // required
    sequence?: number;
    multisig?: MultisigRedeemScriptType;
    decred_tree?: number;
    orig_hash?: string; // RBF
    orig_index?: number; // RBF
    decred_staking_spend?: DecredStakingSpendType;
    script_pubkey?: string; // required if script_type=EXTERNAL
    coinjoin_flags?: number; // bit field of coinjoin-specific flags
    script_sig?: string; // used by EXTERNAL, depending on script_pubkey
    witness?: string; // used by EXTERNAL, depending on script_pubkey
    ownership_proof?: string; // used by EXTERNAL, depending on script_pubkey
    commitment_data?: string; // used by EXTERNAL, depending on ownership_proof
};

export type TxInputType =
    | (CommonTxInputType & {
          address_n: number[];
          script_type?: InternalInputScriptType;
      })
    | (CommonTxInputType & {
          address_n?: typeof undefined;
          script_type: 'EXTERNAL';
          script_pubkey: string;
      });

export type TxInput = TxInputType;

// TxInputType replacement end

export type TxOutputBinType = {
    amount: UintType;
    script_pubkey: string;
    decred_script_version?: number;
};

// TxOutputType replacement
// TxOutputType needs more exact types
// differences: external output (no address_n), opreturn output (no address_n, no address)

export type ChangeOutputScriptType = Exclude<OutputScriptType, 'PAYTOOPRETURN'>;

export type TxOutputType =
    | {
          address: string;
          address_n?: typeof undefined;
          script_type: 'PAYTOADDRESS';
          amount: UintType;
          multisig?: MultisigRedeemScriptType;
          orig_hash?: string;
          orig_index?: number;
          payment_req_index?: number;
      }
    | {
          address?: typeof undefined;
          address_n: number[];
          script_type?: ChangeOutputScriptType;
          amount: UintType;
          multisig?: MultisigRedeemScriptType;
          orig_hash?: string;
          orig_index?: number;
          payment_req_index?: number;
      }
    // NOTE: the type was loosened for compatibility (issue #10474)
    // It is not originally intended to use address instead of address_n with change output
    | {
          address: string;
          address_n?: typeof undefined;
          script_type?: ChangeOutputScriptType;
          amount: UintType;
          multisig?: MultisigRedeemScriptType;
          orig_hash?: string;
          orig_index?: number;
          payment_req_index?: number;
      }
    | {
          address?: typeof undefined;
          address_n?: typeof undefined;
          amount: '0' | 0;
          op_return_data: string;
          script_type: 'PAYTOOPRETURN';
          orig_hash?: string;
          orig_index?: number;
          payment_req_index?: number;
      };

export type TxOutput = TxOutputType;

// - TxOutputType replacement end

// PrevTx
export type PrevTx = {
    version: number;
    lock_time: number;
    inputs_count: number;
    outputs_count: number;
    extra_data_len?: number;
    expiry?: number;
    version_group_id?: number;
    timestamp?: number;
    branch_id?: number;
};

// PrevInput
export type PrevInput = {
    prev_hash: string;
    prev_index: number;
    script_sig: string;
    sequence: number;
    decred_tree?: number;
};

// PrevOutput
export type PrevOutput = {
    amount: UintType;
    script_pubkey: string;
    decred_script_version?: number;
};

export type TextMemo = {
    text: string;
};

export type RefundMemo = {
    address: string;
    mac: string;
};

export type CoinPurchaseMemo = {
    coin_type: number;
    amount: UintType;
    address: string;
    mac: string;
};

export type PaymentRequestMemo = {
    text_memo?: TextMemo;
    refund_memo?: RefundMemo;
    coin_purchase_memo?: CoinPurchaseMemo;
};

// TxAckPaymentRequest
export type TxAckPaymentRequest = {
    nonce?: string;
    recipient_name: string;
    memos?: PaymentRequestMemo[];
    amount?: UintType;
    signature: string;
};

// TxAck
// TxAck replacement
// TxAck needs more exact types
// PrevInput and TxInputType requires exact responses in TxAckResponse
// main difference: PrevInput should not contain address_n (unexpected field by protobuf)

export type TxAckResponse =
    | {
          inputs: Array<TxInputType | PrevInput>;
      }
    | {
          bin_outputs: TxOutputBinType[];
      }
    | {
          outputs: TxOutputType[];
      }
    | {
          extra_data: string;
      }
    | {
          version?: number;
          lock_time?: number;
          inputs_cnt: number;
          outputs_cnt: number;
          extra_data?: string;
          extra_data_len?: number;
          timestamp?: number;
          version_group_id?: number;
          expiry?: number;
          branch_id?: number;
      };

export type TxAck = {
    tx: TxAckResponse;
};
// - TxAck replacement end

export type TxAckInputWrapper = {
    input: TxInput;
};

// TxAckInput
export type TxAckInput = {
    tx: TxAckInputWrapper;
};

export type TxAckOutputWrapper = {
    output: TxOutput;
};

// TxAckOutput
export type TxAckOutput = {
    tx: TxAckOutputWrapper;
};

// TxAckPrevMeta
export type TxAckPrevMeta = {
    tx: PrevTx;
};

export type TxAckPrevInputWrapper = {
    input: PrevInput;
};

// TxAckPrevInput
export type TxAckPrevInput = {
    tx: TxAckPrevInputWrapper;
};

export type TxAckPrevOutputWrapper = {
    output: PrevOutput;
};

// TxAckPrevOutput
export type TxAckPrevOutput = {
    tx: TxAckPrevOutputWrapper;
};

export type TxAckPrevExtraDataWrapper = {
    extra_data_chunk: string;
};

// TxAckPrevExtraData
export type TxAckPrevExtraData = {
    tx: TxAckPrevExtraDataWrapper;
};

// GetOwnershipProof
export type GetOwnershipProof = {
    address_n: number[];
    coin_name?: string;
    script_type?: InputScriptType;
    multisig?: MultisigRedeemScriptType;
    user_confirmation?: boolean;
    ownership_ids?: string[];
    commitment_data?: string;
};

// OwnershipProof
export type OwnershipProof = {
    ownership_proof: string;
    signature: string;
};

// AuthorizeCoinJoin
export type AuthorizeCoinJoin = {
    coordinator: string;
    max_rounds: number;
    max_coordinator_fee_rate: number;
    max_fee_per_kvbyte: number;
    address_n: number[];
    coin_name?: string;
    script_type?: InputScriptType;
    amount_unit?: AmountUnit;
};

// FirmwareErase
export type FirmwareErase = {
    length?: number;
};

// FirmwareRequest
export type FirmwareRequest = {
    offset: number;
    length: number;
};

// FirmwareUpload
export type FirmwareUpload = {
    payload: Buffer | ArrayBuffer;
    hash?: string;
};

// SelfTest
export type SelfTest = {
    payload?: string;
};

export enum CardanoDerivationType {
    LEDGER = 0,
    ICARUS = 1,
    ICARUS_TREZOR = 2,
}

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

export enum CardanoNativeScriptType {
    PUB_KEY = 0,
    ALL = 1,
    ANY = 2,
    N_OF_K = 3,
    INVALID_BEFORE = 4,
    INVALID_HEREAFTER = 5,
}

export enum CardanoNativeScriptHashDisplayFormat {
    HIDE = 0,
    BECH32 = 1,
    POLICY_ID = 2,
}

export enum CardanoTxOutputSerializationFormat {
    ARRAY_LEGACY = 0,
    MAP_BABBAGE = 1,
}

export enum CardanoCertificateType {
    STAKE_REGISTRATION = 0,
    STAKE_DEREGISTRATION = 1,
    STAKE_DELEGATION = 2,
    STAKE_POOL_REGISTRATION = 3,
}

export enum CardanoPoolRelayType {
    SINGLE_HOST_IP = 0,
    SINGLE_HOST_NAME = 1,
    MULTIPLE_HOST_NAME = 2,
}

export enum CardanoTxAuxiliaryDataSupplementType {
    NONE = 0,
    CVOTE_REGISTRATION_SIGNATURE = 1,
}

export enum CardanoCVoteRegistrationFormat {
    CIP15 = 0,
    CIP36 = 1,
}

export enum CardanoTxSigningMode {
    ORDINARY_TRANSACTION = 0,
    POOL_REGISTRATION_AS_OWNER = 1,
    MULTISIG_TRANSACTION = 2,
    PLUTUS_TRANSACTION = 3,
}

export enum CardanoTxWitnessType {
    BYRON_WITNESS = 0,
    SHELLEY_WITNESS = 1,
}

// CardanoBlockchainPointerType
export type CardanoBlockchainPointerType = {
    block_index: number;
    tx_index: number;
    certificate_index: number;
};

// CardanoNativeScript
export type CardanoNativeScript = {
    type: CardanoNativeScriptType;
    scripts?: CardanoNativeScript[];
    key_hash?: string;
    key_path?: number[];
    required_signatures_count?: number;
    invalid_before?: UintType;
    invalid_hereafter?: UintType;
};

// CardanoGetNativeScriptHash
export type CardanoGetNativeScriptHash = {
    script: CardanoNativeScript;
    display_format: CardanoNativeScriptHashDisplayFormat;
    derivation_type: CardanoDerivationType;
};

// CardanoNativeScriptHash
export type CardanoNativeScriptHash = {
    script_hash: string;
};

// CardanoAddressParametersType
export type CardanoAddressParametersType = {
    address_type: CardanoAddressType;
    address_n: number[];
    address_n_staking: number[];
    staking_key_hash?: string;
    certificate_pointer?: CardanoBlockchainPointerType;
    script_payment_hash?: string;
    script_staking_hash?: string;
};

// CardanoGetAddress
export type CardanoGetAddress = {
    show_display?: boolean;
    protocol_magic: number;
    network_id: number;
    address_parameters: CardanoAddressParametersType;
    derivation_type: CardanoDerivationType;
    chunkify?: boolean;
};

// CardanoAddress
export type CardanoAddress = {
    address: string;
};

// CardanoGetPublicKey
export type CardanoGetPublicKey = {
    address_n: number[];
    show_display?: boolean;
    derivation_type: CardanoDerivationType;
};

// CardanoPublicKey
export type CardanoPublicKey = {
    xpub: string;
    node: HDNodeType;
};

// CardanoSignTxInit
export type CardanoSignTxInit = {
    signing_mode: CardanoTxSigningMode;
    protocol_magic: number;
    network_id: number;
    inputs_count: number;
    outputs_count: number;
    fee: UintType;
    ttl?: UintType;
    certificates_count: number;
    withdrawals_count: number;
    has_auxiliary_data: boolean;
    validity_interval_start?: UintType;
    witness_requests_count: number;
    minting_asset_groups_count: number;
    derivation_type: CardanoDerivationType;
    include_network_id?: boolean;
    script_data_hash?: string;
    collateral_inputs_count: number;
    required_signers_count: number;
    has_collateral_return?: boolean;
    total_collateral?: UintType;
    reference_inputs_count?: number;
    chunkify?: boolean;
};

// CardanoTxInput
export type CardanoTxInput = {
    prev_hash: string;
    prev_index: number;
};

// CardanoTxOutput
export type CardanoTxOutput = {
    address?: string;
    address_parameters?: CardanoAddressParametersType;
    amount: UintType;
    asset_groups_count: number;
    datum_hash?: string;
    format?: CardanoTxOutputSerializationFormat;
    inline_datum_size?: number;
    reference_script_size?: number;
};

// CardanoAssetGroup
export type CardanoAssetGroup = {
    policy_id: string;
    tokens_count: number;
};

// CardanoToken
export type CardanoToken = {
    asset_name_bytes: string;
    amount?: UintType;
    mint_amount?: SintType;
};

// CardanoTxInlineDatumChunk
export type CardanoTxInlineDatumChunk = {
    data: string;
};

// CardanoTxReferenceScriptChunk
export type CardanoTxReferenceScriptChunk = {
    data: string;
};

// CardanoPoolOwner
export type CardanoPoolOwner = {
    staking_key_path?: number[];
    staking_key_hash?: string;
};

// CardanoPoolRelayParameters
export type CardanoPoolRelayParameters = {
    type: CardanoPoolRelayType;
    ipv4_address?: string;
    ipv6_address?: string;
    host_name?: string;
    port?: number;
};

// CardanoPoolMetadataType
export type CardanoPoolMetadataType = {
    url: string;
    hash: string;
};

// CardanoPoolParametersType
export type CardanoPoolParametersType = {
    pool_id: string;
    vrf_key_hash: string;
    pledge: UintType;
    cost: UintType;
    margin_numerator: UintType;
    margin_denominator: UintType;
    reward_account: string;
    metadata?: CardanoPoolMetadataType;
    owners_count: number;
    relays_count: number;
};

// CardanoTxCertificate
export type CardanoTxCertificate = {
    type: CardanoCertificateType;
    path?: number[];
    pool?: string;
    pool_parameters?: CardanoPoolParametersType;
    script_hash?: string;
    key_hash?: string;
};

// CardanoTxWithdrawal
export type CardanoTxWithdrawal = {
    path?: number[];
    amount: UintType;
    script_hash?: string;
    key_hash?: string;
};

// CardanoCVoteRegistrationDelegation
export type CardanoCVoteRegistrationDelegation = {
    vote_public_key: string;
    weight: UintType;
};

// CardanoCVoteRegistrationParametersType
export type CardanoCVoteRegistrationParametersType = {
    vote_public_key?: string;
    staking_path: number[];
    payment_address_parameters?: CardanoAddressParametersType;
    nonce: UintType;
    format?: CardanoCVoteRegistrationFormat;
    delegations?: CardanoCVoteRegistrationDelegation[];
    voting_purpose?: UintType;
    payment_address?: string;
};

// CardanoTxAuxiliaryData
export type CardanoTxAuxiliaryData = {
    cvote_registration_parameters?: CardanoCVoteRegistrationParametersType;
    hash?: string;
};

// CardanoTxMint
export type CardanoTxMint = {
    asset_groups_count: number;
};

// CardanoTxCollateralInput
export type CardanoTxCollateralInput = {
    prev_hash: string;
    prev_index: number;
};

// CardanoTxRequiredSigner
export type CardanoTxRequiredSigner = {
    key_hash?: string;
    key_path?: number[];
};

// CardanoTxReferenceInput
export type CardanoTxReferenceInput = {
    prev_hash: string;
    prev_index: number;
};

// CardanoTxItemAck
export type CardanoTxItemAck = {};

// CardanoTxAuxiliaryDataSupplement
export type CardanoTxAuxiliaryDataSupplement = {
    type: CardanoTxAuxiliaryDataSupplementType;
    auxiliary_data_hash?: string;
    cvote_registration_signature?: string;
};

// CardanoTxWitnessRequest
export type CardanoTxWitnessRequest = {
    path: number[];
};

// CardanoTxWitnessResponse
export type CardanoTxWitnessResponse = {
    type: CardanoTxWitnessType;
    pub_key: string;
    signature: string;
    chain_code?: string;
};

// CardanoTxHostAck
export type CardanoTxHostAck = {};

// CardanoTxBodyHash
export type CardanoTxBodyHash = {
    tx_hash: string;
};

// CardanoSignTxFinished
export type CardanoSignTxFinished = {};

// CardanoSignMessageInit
export type CardanoSignMessageInit = {
    protocol_magic?: number;
    network_id?: number;
    signing_path: number[];
    payload_size: number;
    hash_payload: boolean;
    display_ascii: boolean;
    address_parameters?: CardanoAddressParametersType;
    derivation_type: CardanoDerivationType;
};

// CardanoMessageItemAck
export type CardanoMessageItemAck = {};

// CardanoMessagePayloadChunk
export type CardanoMessagePayloadChunk = {
    data: string;
};

// CardanoMessageItemHostAck
export type CardanoMessageItemHostAck = {};

// CardanoSignMessageFinished
export type CardanoSignMessageFinished = {
    signature: string;
    address: string;
};

// Success
export type Success = {
    message: string;
};

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

// Failure
export type Failure = {
    code?: FailureType;
    message?: string;
};

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

export type ButtonRequestType = keyof typeof Enum_ButtonRequestType;

// ButtonRequest
export type ButtonRequest = {
    code?: ButtonRequestType;
    pages?: number;
};

// ButtonAck
export type ButtonAck = {};

export enum Enum_PinMatrixRequestType {
    PinMatrixRequestType_Current = 1,
    PinMatrixRequestType_NewFirst = 2,
    PinMatrixRequestType_NewSecond = 3,
    PinMatrixRequestType_WipeCodeFirst = 4,
    PinMatrixRequestType_WipeCodeSecond = 5,
}

export type PinMatrixRequestType = keyof typeof Enum_PinMatrixRequestType;

// PinMatrixRequest
export type PinMatrixRequest = {
    type?: PinMatrixRequestType;
};

// PinMatrixAck
export type PinMatrixAck = {
    pin: string;
};

// PassphraseRequest
export type PassphraseRequest = {
    _on_device?: boolean;
};

// PassphraseAck
export type PassphraseAck = {
    passphrase?: string;
    _state?: string;
    on_device?: boolean;
};

// Deprecated_PassphraseStateRequest
export type Deprecated_PassphraseStateRequest = {
    state?: string;
};

// Deprecated_PassphraseStateAck
export type Deprecated_PassphraseStateAck = {};

// CipherKeyValue
export type CipherKeyValue = {
    address_n: number[];
    key: string;
    value: string;
    encrypt?: boolean;
    ask_on_encrypt?: boolean;
    ask_on_decrypt?: boolean;
    iv?: string;
};

// CipheredKeyValue
export type CipheredKeyValue = {
    value: string;
};

// IdentityType
export type IdentityType = {
    proto?: string;
    user?: string;
    host?: string;
    port?: string;
    path?: string;
    index?: number;
};

// SignIdentity
export type SignIdentity = {
    identity: IdentityType;
    challenge_hidden?: string;
    challenge_visual?: string;
    ecdsa_curve_name?: string;
};

// SignedIdentity
export type SignedIdentity = {
    address: string;
    public_key: string;
    signature: string;
};

// GetECDHSessionKey
export type GetECDHSessionKey = {
    identity: IdentityType;
    peer_public_key: string;
    ecdsa_curve_name?: string;
};

// ECDHSessionKey
export type ECDHSessionKey = {
    session_key: string;
    public_key?: string;
};

export enum DebugButton {
    NO = 0,
    YES = 1,
    INFO = 2,
}

export enum DebugPhysicalButton {
    LEFT_BTN = 0,
    MIDDLE_BTN = 1,
    RIGHT_BTN = 2,
}

// DebugLinkResetDebugEvents
export type DebugLinkResetDebugEvents = {};

// EosGetPublicKey
export type EosGetPublicKey = {
    address_n: number[];
    show_display?: boolean;
    chunkify?: boolean;
};

// EosPublicKey
export type EosPublicKey = {
    wif_public_key: string;
    raw_public_key: string;
};

export type EosTxHeader = {
    expiration: number;
    ref_block_num: number;
    ref_block_prefix: number;
    max_net_usage_words: number;
    max_cpu_usage_ms: number;
    delay_sec: number;
};

// EosSignTx
export type EosSignTx = {
    address_n: number[];
    chain_id: string;
    header: EosTxHeader;
    num_actions: number;
    chunkify?: boolean;
};

// EosTxActionRequest
export type EosTxActionRequest = {
    data_size?: number;
};

export type EosAsset = {
    amount: UintType;
    symbol: string;
};

export type EosPermissionLevel = {
    actor: string;
    permission: string;
};

export type EosAuthorizationKey = {
    type?: number;
    key: string;
    address_n?: number[];
    weight: number;
};

export type EosAuthorizationAccount = {
    account: EosPermissionLevel;
    weight: number;
};

export type EosAuthorizationWait = {
    wait_sec: number;
    weight: number;
};

export type EosAuthorization = {
    threshold: number;
    keys: EosAuthorizationKey[];
    accounts: EosAuthorizationAccount[];
    waits: EosAuthorizationWait[];
};

export type EosActionCommon = {
    account: string;
    name: string;
    authorization: EosPermissionLevel[];
};

export type EosActionTransfer = {
    sender: string;
    receiver: string;
    quantity: EosAsset;
    memo: string;
};

export type EosActionDelegate = {
    sender: string;
    receiver: string;
    net_quantity: EosAsset;
    cpu_quantity: EosAsset;
    transfer: boolean;
};

export type EosActionUndelegate = {
    sender: string;
    receiver: string;
    net_quantity: EosAsset;
    cpu_quantity: EosAsset;
};

export type EosActionRefund = {
    owner: string;
};

export type EosActionBuyRam = {
    payer: string;
    receiver: string;
    quantity: EosAsset;
};

export type EosActionBuyRamBytes = {
    payer: string;
    receiver: string;
    bytes: number;
};

export type EosActionSellRam = {
    account: string;
    bytes: number;
};

export type EosActionVoteProducer = {
    voter: string;
    proxy: string;
    producers: string[];
};

export type EosActionUpdateAuth = {
    account: string;
    permission: string;
    parent: string;
    auth: EosAuthorization;
};

export type EosActionDeleteAuth = {
    account: string;
    permission: string;
};

export type EosActionLinkAuth = {
    account: string;
    code: string;
    type: string;
    requirement: string;
};

export type EosActionUnlinkAuth = {
    account: string;
    code: string;
    type: string;
};

export type EosActionNewAccount = {
    creator: string;
    name: string;
    owner: EosAuthorization;
    active: EosAuthorization;
};

export type EosActionUnknown = {
    data_size: number;
    data_chunk: string;
};

// EosTxActionAck
export type EosTxActionAck = {
    common: EosActionCommon;
    transfer?: EosActionTransfer;
    delegate?: EosActionDelegate;
    undelegate?: EosActionUndelegate;
    refund?: EosActionRefund;
    buy_ram?: EosActionBuyRam;
    buy_ram_bytes?: EosActionBuyRamBytes;
    sell_ram?: EosActionSellRam;
    vote_producer?: EosActionVoteProducer;
    update_auth?: EosActionUpdateAuth;
    delete_auth?: EosActionDeleteAuth;
    link_auth?: EosActionLinkAuth;
    unlink_auth?: EosActionUnlinkAuth;
    new_account?: EosActionNewAccount;
    unknown?: EosActionUnknown;
};

// EosSignedTx
export type EosSignedTx = {
    signature: string;
};

export enum EthereumDefinitionType {
    NETWORK = 0,
    TOKEN = 1,
}

// EthereumNetworkInfo
export type EthereumNetworkInfo = {
    chain_id: number;
    symbol: string;
    slip44: number;
    name: string;
};

// EthereumTokenInfo
export type EthereumTokenInfo = {
    address: string;
    chain_id: number;
    symbol: string;
    decimals: number;
    name: string;
};

// EthereumDefinitions
export type EthereumDefinitions = {
    encoded_network?: ArrayBuffer;
    encoded_token?: ArrayBuffer;
};

// EthereumSignTypedData
export type EthereumSignTypedData = {
    address_n: number[];
    primary_type: string;
    metamask_v4_compat?: boolean;
    definitions?: EthereumDefinitions;
};

// EthereumTypedDataStructRequest
export type EthereumTypedDataStructRequest = {
    name: string;
};

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

export type EthereumFieldType = {
    data_type: EthereumDataType;
    size?: number;
    entry_type?: EthereumFieldType;
    struct_name?: string;
};

export type EthereumStructMember = {
    type: EthereumFieldType;
    name: string;
};

// EthereumTypedDataStructAck
export type EthereumTypedDataStructAck = {
    members: EthereumStructMember[];
};

// EthereumTypedDataValueRequest
export type EthereumTypedDataValueRequest = {
    member_path: number[];
};

// EthereumTypedDataValueAck
export type EthereumTypedDataValueAck = {
    value: string;
};

// EthereumGetPublicKey
export type EthereumGetPublicKey = {
    address_n: number[];
    show_display?: boolean;
};

// EthereumPublicKey
export type EthereumPublicKey = {
    node: HDNodeType;
    xpub: string;
};

// EthereumGetAddress
export type EthereumGetAddress = {
    address_n: number[];
    show_display?: boolean;
    encoded_network?: ArrayBuffer;
    chunkify?: boolean;
};

// EthereumAddress
export type EthereumAddress = {
    _old_address?: string;
    address: string;
};

// EthereumSignTx
export type EthereumSignTx = {
    address_n: number[];
    nonce?: string;
    gas_price: string;
    gas_limit: string;
    to?: string;
    value?: string;
    data_initial_chunk?: string;
    data_length?: number;
    chain_id: number;
    tx_type?: number;
    definitions?: EthereumDefinitions;
    chunkify?: boolean;
};

export type EthereumAccessList = {
    address: string;
    storage_keys: string[];
};

// EthereumSignTxEIP1559
export type EthereumSignTxEIP1559 = {
    address_n: number[];
    nonce: string;
    max_gas_fee: string;
    max_priority_fee: string;
    gas_limit: string;
    to?: string;
    value: string;
    data_initial_chunk?: string;
    data_length: number;
    chain_id: number;
    access_list: EthereumAccessList[];
    definitions?: EthereumDefinitions;
    chunkify?: boolean;
};

// EthereumTxRequest
export type EthereumTxRequest = {
    data_length?: number;
    signature_v?: number;
    signature_r?: string;
    signature_s?: string;
};

// EthereumTxAck
export type EthereumTxAck = {
    data_chunk: string;
};

// EthereumSignMessage
export type EthereumSignMessage = {
    address_n: number[];
    message: string;
    encoded_network?: ArrayBuffer;
    chunkify?: boolean;
};

// EthereumMessageSignature
export type EthereumMessageSignature = {
    signature: string;
    address: string;
};

// EthereumVerifyMessage
export type EthereumVerifyMessage = {
    signature: string;
    message: string;
    address: string;
    chunkify?: boolean;
};

// EthereumSignTypedHash
export type EthereumSignTypedHash = {
    address_n: number[];
    domain_separator_hash: string;
    message_hash?: string;
    encoded_network?: ArrayBuffer;
};

// EthereumTypedDataSignature
export type EthereumTypedDataSignature = {
    signature: string;
    address: string;
};

export enum Enum_BackupType {
    Bip39 = 0,
    Slip39_Basic = 1,
    Slip39_Advanced = 2,
}

export type BackupType = keyof typeof Enum_BackupType;

export enum Enum_SafetyCheckLevel {
    Strict = 0,
    PromptAlways = 1,
    PromptTemporarily = 2,
}

export type SafetyCheckLevel = keyof typeof Enum_SafetyCheckLevel;

export enum Enum_HomescreenFormat {
    Toif = 1,
    Jpeg = 2,
    ToiG = 3,
}

export type HomescreenFormat = keyof typeof Enum_HomescreenFormat;

// Initialize
export type Initialize = {
    session_id?: string;
    _skip_passphrase?: boolean;
    derive_cardano?: boolean;
};

// GetFeatures
export type GetFeatures = {};

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

export type Capability = keyof typeof Enum_Capability;

// Features
export type Features = {
    vendor: string;
    major_version: number;
    minor_version: number;
    patch_version: number;
    bootloader_mode: boolean | null;
    device_id: string | null;
    pin_protection: boolean | null;
    passphrase_protection: boolean | null;
    language: string | null;
    label: string | null;
    initialized: boolean | null;
    revision: string | null;
    bootloader_hash: string | null;
    imported: boolean | null;
    unlocked: boolean | null;
    _passphrase_cached?: boolean;
    firmware_present: boolean | null;
    needs_backup: boolean | null;
    flags: number | null;
    model: string;
    fw_major: number | null;
    fw_minor: number | null;
    fw_patch: number | null;
    fw_vendor: string | null;
    unfinished_backup: boolean | null;
    no_backup: boolean | null;
    recovery_mode: boolean | null;
    capabilities: Capability[];
    backup_type: BackupType | null;
    sd_card_present: boolean | null;
    sd_protection: boolean | null;
    wipe_code_protection: boolean | null;
    session_id: string | null;
    passphrase_always_on_device: boolean | null;
    safety_checks: SafetyCheckLevel | null;
    auto_lock_delay_ms: number | null;
    display_rotation: number | null;
    experimental_features: boolean | null;
    busy?: boolean;
    homescreen_format?: HomescreenFormat;
    hide_passphrase_from_host?: boolean;
    internal_model: DeviceModelInternal;
    unit_color?: number;
    unit_btconly?: boolean;
    homescreen_width?: number;
    homescreen_height?: number;
    bootloader_locked?: boolean;
};

// LockDevice
export type LockDevice = {};

// SetBusy
export type SetBusy = {
    expiry_ms?: number;
};

// EndSession
export type EndSession = {};

// ApplySettings
export type ApplySettings = {
    language?: string;
    label?: string;
    use_passphrase?: boolean;
    homescreen?: string;
    _passphrase_source?: number;
    auto_lock_delay_ms?: number;
    display_rotation?: number;
    passphrase_always_on_device?: boolean;
    safety_checks?: SafetyCheckLevel;
    experimental_features?: boolean;
    hide_passphrase_from_host?: boolean;
};

// ChangeLanguage
export type ChangeLanguage = {
    data_length: number;
    show_display?: boolean;
};

// TranslationDataRequest
export type TranslationDataRequest = {
    data_length: number;
    data_offset: number;
};

// TranslationDataAck
export type TranslationDataAck = {
    data_chunk: string;
};

// ApplyFlags
export type ApplyFlags = {
    flags: number;
};

// ChangePin
export type ChangePin = {
    remove?: boolean;
};

// ChangeWipeCode
export type ChangeWipeCode = {
    remove?: boolean;
};

export enum SdProtectOperationType {
    DISABLE = 0,
    ENABLE = 1,
    REFRESH = 2,
}

// SdProtect
export type SdProtect = {
    operation: SdProtectOperationType;
};

// Ping
export type Ping = {
    message?: string;
    button_protection?: boolean;
};

// Cancel
export type Cancel = {};

// GetEntropy
export type GetEntropy = {
    size: number;
};

// Entropy
export type Entropy = {
    entropy: string;
};

// GetFirmwareHash
export type GetFirmwareHash = {
    challenge?: string;
};

// FirmwareHash
export type FirmwareHash = {
    hash: string;
};

// AuthenticateDevice
export type AuthenticateDevice = {
    challenge: string;
};

// AuthenticityProof
export type AuthenticityProof = {
    certificates: string[];
    signature: string;
};

// WipeDevice
export type WipeDevice = {};

// ResetDevice
export type ResetDevice = {
    display_random?: boolean;
    strength?: number;
    passphrase_protection?: boolean;
    pin_protection?: boolean;
    language?: string;
    label?: string;
    u2f_counter?: number;
    skip_backup?: boolean;
    no_backup?: boolean;
    backup_type?: string | number;
};

// BackupDevice
export type BackupDevice = {};

// EntropyRequest
export type EntropyRequest = {};

// EntropyAck
export type EntropyAck = {
    entropy: string;
};

export enum RecoveryDeviceType {
    RecoveryDeviceType_ScrambledWords = 0,
    RecoveryDeviceType_Matrix = 1,
}

// RecoveryDevice
export type RecoveryDevice = {
    word_count?: number;
    passphrase_protection?: boolean;
    pin_protection?: boolean;
    language?: string;
    label?: string;
    enforce_wordlist?: boolean;
    type?: RecoveryDeviceType;
    u2f_counter?: number;
    dry_run?: boolean;
};

export enum Enum_WordRequestType {
    WordRequestType_Plain = 0,
    WordRequestType_Matrix9 = 1,
    WordRequestType_Matrix6 = 2,
}

export type WordRequestType = keyof typeof Enum_WordRequestType;

// WordRequest
export type WordRequest = {
    type: WordRequestType;
};

// WordAck
export type WordAck = {
    word: string;
};

// SetU2FCounter
export type SetU2FCounter = {
    u2f_counter: number;
};

// GetNextU2FCounter
export type GetNextU2FCounter = {};

// NextU2FCounter
export type NextU2FCounter = {
    u2f_counter: number;
};

// DoPreauthorized
export type DoPreauthorized = {};

// PreauthorizedRequest
export type PreauthorizedRequest = {};

// CancelAuthorization
export type CancelAuthorization = {};

export enum BootCommand {
    STOP_AND_WAIT = 0,
    INSTALL_UPGRADE = 1,
}

// RebootToBootloader
export type RebootToBootloader = {
    boot_command?: BootCommand;
    firmware_header?: string;
    language_data_length?: number;
};

// GetNonce
export type GetNonce = {};

// Nonce
export type Nonce = {
    nonce: string;
};

// UnlockPath
export type UnlockPath = {
    address_n: number[];
    mac?: string;
};

// UnlockedPathRequest
export type UnlockedPathRequest = {
    mac?: string;
};

// ShowDeviceTutorial
export type ShowDeviceTutorial = {};

// UnlockBootloader
export type UnlockBootloader = {};

export enum MoneroNetworkType {
    MAINNET = 0,
    TESTNET = 1,
    STAGENET = 2,
    FAKECHAIN = 3,
}

// NEMGetAddress
export type NEMGetAddress = {
    address_n: number[];
    network?: number;
    show_display?: boolean;
    chunkify?: boolean;
};

// NEMAddress
export type NEMAddress = {
    address: string;
};

export type NEMTransactionCommon = {
    address_n?: number[];
    network?: number;
    timestamp: number;
    fee: UintType;
    deadline: number;
    signer?: string;
};

export type NEMMosaic = {
    namespace: string;
    mosaic: string;
    quantity: number;
};

export type NEMTransfer = {
    recipient: string;
    amount: UintType;
    payload?: string;
    public_key?: string;
    mosaics?: NEMMosaic[];
};

export type NEMProvisionNamespace = {
    namespace: string;
    parent?: string;
    sink: string;
    fee: UintType;
};

export enum NEMMosaicLevy {
    MosaicLevy_Absolute = 1,
    MosaicLevy_Percentile = 2,
}

export type NEMMosaicDefinition = {
    name?: string;
    ticker?: string;
    namespace: string;
    mosaic: string;
    divisibility?: number;
    levy?: NEMMosaicLevy;
    fee?: UintType;
    levy_address?: string;
    levy_namespace?: string;
    levy_mosaic?: string;
    supply?: number;
    mutable_supply?: boolean;
    transferable?: boolean;
    description: string;
    networks?: number[];
};

export type NEMMosaicCreation = {
    definition: NEMMosaicDefinition;
    sink: string;
    fee: UintType;
};

export enum NEMSupplyChangeType {
    SupplyChange_Increase = 1,
    SupplyChange_Decrease = 2,
}

export type NEMMosaicSupplyChange = {
    namespace: string;
    mosaic: string;
    type: NEMSupplyChangeType;
    delta: number;
};

export enum NEMModificationType {
    CosignatoryModification_Add = 1,
    CosignatoryModification_Delete = 2,
}

export type NEMCosignatoryModification = {
    type: NEMModificationType;
    public_key: string;
};

export type NEMAggregateModification = {
    modifications?: NEMCosignatoryModification[];
    relative_change?: number;
};

export enum NEMImportanceTransferMode {
    ImportanceTransfer_Activate = 1,
    ImportanceTransfer_Deactivate = 2,
}

export type NEMImportanceTransfer = {
    mode: NEMImportanceTransferMode;
    public_key: string;
};

// NEMSignTx
export type NEMSignTx = {
    transaction: NEMTransactionCommon;
    multisig?: NEMTransactionCommon;
    transfer?: NEMTransfer;
    cosigning?: boolean;
    provision_namespace?: NEMProvisionNamespace;
    mosaic_creation?: NEMMosaicCreation;
    supply_change?: NEMMosaicSupplyChange;
    aggregate_modification?: NEMAggregateModification;
    importance_transfer?: NEMImportanceTransfer;
    chunkify?: boolean;
};

// NEMSignedTx
export type NEMSignedTx = {
    data: string;
    signature: string;
};

// NEMDecryptMessage
export type NEMDecryptMessage = {
    address_n: number[];
    network?: number;
    public_key?: string;
    payload?: string;
};

// NEMDecryptedMessage
export type NEMDecryptedMessage = {
    payload: string;
};

// RippleGetAddress
export type RippleGetAddress = {
    address_n: number[];
    show_display?: boolean;
    chunkify?: boolean;
};

// RippleAddress
export type RippleAddress = {
    address: string;
};

export type RipplePayment = {
    amount: UintType;
    destination: string;
    destination_tag?: number;
};

// RippleSignTx
export type RippleSignTx = {
    address_n: number[];
    fee: UintType;
    flags?: number;
    sequence: number;
    last_ledger_sequence?: number;
    payment: RipplePayment;
    chunkify?: boolean;
};

// RippleSignedTx
export type RippleSignedTx = {
    signature: string;
    serialized_tx: string;
};

// SolanaGetPublicKey
export type SolanaGetPublicKey = {
    address_n: number[];
    show_display?: boolean;
};

// SolanaPublicKey
export type SolanaPublicKey = {
    public_key: string;
};

// SolanaGetAddress
export type SolanaGetAddress = {
    address_n: number[];
    show_display?: boolean;
    chunkify?: boolean;
};

// SolanaAddress
export type SolanaAddress = {
    address: string;
};

// SolanaTxTokenAccountInfo
export type SolanaTxTokenAccountInfo = {
    base_address: string;
    token_program: string;
    token_mint: string;
    token_account: string;
};

// SolanaTxAdditionalInfo
export type SolanaTxAdditionalInfo = {
    token_accounts_infos: SolanaTxTokenAccountInfo[];
};

// SolanaSignTx
export type SolanaSignTx = {
    address_n: number[];
    serialized_tx: string;
    additional_info?: SolanaTxAdditionalInfo;
};

// SolanaTxSignature
export type SolanaTxSignature = {
    signature: string;
};

export enum StellarAssetType {
    NATIVE = 0,
    ALPHANUM4 = 1,
    ALPHANUM12 = 2,
}

// StellarAsset
export type StellarAsset = {
    type: 0 | 1 | 2 | 'NATIVE' | 'ALPHANUM4' | 'ALPHANUM12';
    code?: string;
    issuer?: string;
};

// StellarGetAddress
export type StellarGetAddress = {
    address_n: number[];
    show_display?: boolean;
    chunkify?: boolean;
};

// StellarAddress
export type StellarAddress = {
    address: string;
};

export enum StellarMemoType {
    NONE = 0,
    TEXT = 1,
    ID = 2,
    HASH = 3,
    RETURN = 4,
}

// StellarSignTx
export type StellarSignTx = {
    address_n: number[];
    network_passphrase: string;
    source_account: string;
    fee: UintType;
    sequence_number: UintType;
    timebounds_start: number;
    timebounds_end: number;
    memo_type: StellarMemoType;
    memo_text?: string;
    memo_id?: UintType;
    memo_hash?: Buffer | string;
    num_operations: number;
};

// StellarTxOpRequest
export type StellarTxOpRequest = {};

// StellarPaymentOp
export type StellarPaymentOp = {
    source_account?: string;
    destination_account: string;
    asset: StellarAsset;
    amount: UintType;
};

// StellarCreateAccountOp
export type StellarCreateAccountOp = {
    source_account?: string;
    new_account: string;
    starting_balance: UintType;
};

// StellarPathPaymentStrictReceiveOp
export type StellarPathPaymentStrictReceiveOp = {
    source_account?: string;
    send_asset: StellarAsset;
    send_max: UintType;
    destination_account: string;
    destination_asset: StellarAsset;
    destination_amount: UintType;
    paths?: StellarAsset[];
};

// StellarPathPaymentStrictSendOp
export type StellarPathPaymentStrictSendOp = {
    source_account?: string;
    send_asset: StellarAsset;
    send_amount: UintType;
    destination_account: string;
    destination_asset: StellarAsset;
    destination_min: UintType;
    paths?: StellarAsset[];
};

// StellarManageSellOfferOp
export type StellarManageSellOfferOp = {
    source_account?: string;
    selling_asset: StellarAsset;
    buying_asset: StellarAsset;
    amount: UintType;
    price_n: number;
    price_d: number;
    offer_id: UintType;
};

// StellarManageBuyOfferOp
export type StellarManageBuyOfferOp = {
    source_account?: string;
    selling_asset: StellarAsset;
    buying_asset: StellarAsset;
    amount: UintType;
    price_n: number;
    price_d: number;
    offer_id: UintType;
};

// StellarCreatePassiveSellOfferOp
export type StellarCreatePassiveSellOfferOp = {
    source_account?: string;
    selling_asset: StellarAsset;
    buying_asset: StellarAsset;
    amount: UintType;
    price_n: number;
    price_d: number;
};

export enum StellarSignerType {
    ACCOUNT = 0,
    PRE_AUTH = 1,
    HASH = 2,
}

// StellarSetOptionsOp
export type StellarSetOptionsOp = {
    source_account?: string;
    inflation_destination_account?: string;
    clear_flags?: number;
    set_flags?: number;
    master_weight?: UintType;
    low_threshold?: UintType;
    medium_threshold?: UintType;
    high_threshold?: UintType;
    home_domain?: string;
    signer_type?: StellarSignerType;
    signer_key?: Buffer | string;
    signer_weight?: number;
};

// StellarChangeTrustOp
export type StellarChangeTrustOp = {
    source_account?: string;
    asset: StellarAsset;
    limit: UintType;
};

// StellarAllowTrustOp
export type StellarAllowTrustOp = {
    source_account?: string;
    trusted_account: string;
    asset_type: StellarAssetType;
    asset_code?: string;
    is_authorized: boolean;
};

// StellarAccountMergeOp
export type StellarAccountMergeOp = {
    source_account?: string;
    destination_account: string;
};

// StellarManageDataOp
export type StellarManageDataOp = {
    source_account?: string;
    key: string;
    value?: Buffer | string;
};

// StellarBumpSequenceOp
export type StellarBumpSequenceOp = {
    source_account?: string;
    bump_to: UintType;
};

// StellarSignedTx
export type StellarSignedTx = {
    public_key: string;
    signature: string;
};

// TezosGetAddress
export type TezosGetAddress = {
    address_n: number[];
    show_display?: boolean;
    chunkify?: boolean;
};

// TezosAddress
export type TezosAddress = {
    address: string;
};

// TezosGetPublicKey
export type TezosGetPublicKey = {
    address_n: number[];
    show_display?: boolean;
    chunkify?: boolean;
};

// TezosPublicKey
export type TezosPublicKey = {
    public_key: string;
};

export enum TezosContractType {
    Implicit = 0,
    Originated = 1,
}

export type TezosContractID = {
    tag: number;
    hash: Uint8Array;
};

export type TezosRevealOp = {
    source: Uint8Array;
    fee: UintType;
    counter: number;
    gas_limit: number;
    storage_limit: number;
    public_key: Uint8Array;
};

export type TezosManagerTransfer = {
    destination: TezosContractID;
    amount: UintType;
};

export type TezosParametersManager = {
    set_delegate?: Uint8Array;
    cancel_delegate?: boolean;
    transfer?: TezosManagerTransfer;
};

export type TezosTransactionOp = {
    source: Uint8Array;
    fee: UintType;
    counter: number;
    gas_limit: number;
    storage_limit: number;
    amount: UintType;
    destination: TezosContractID;
    parameters?: number[];
    parameters_manager?: TezosParametersManager;
};

export type TezosOriginationOp = {
    source: Uint8Array;
    fee: UintType;
    counter: number;
    gas_limit: number;
    storage_limit: number;
    manager_pubkey?: string;
    balance: number;
    spendable?: boolean;
    delegatable?: boolean;
    delegate?: Uint8Array;
    script: string | number[];
};

export type TezosDelegationOp = {
    source: Uint8Array;
    fee: UintType;
    counter: number;
    gas_limit: number;
    storage_limit: number;
    delegate: Uint8Array;
};

export type TezosProposalOp = {
    source: string;
    period: number;
    proposals: string[];
};

export enum TezosBallotType {
    Yay = 0,
    Nay = 1,
    Pass = 2,
}

export type TezosBallotOp = {
    source: string;
    period: number;
    proposal: string;
    ballot: TezosBallotType;
};

// TezosSignTx
export type TezosSignTx = {
    address_n: number[];
    branch: Uint8Array;
    reveal?: TezosRevealOp;
    transaction?: TezosTransactionOp;
    origination?: TezosOriginationOp;
    delegation?: TezosDelegationOp;
    proposal?: TezosProposalOp;
    ballot?: TezosBallotOp;
    chunkify?: boolean;
};

// TezosSignedTx
export type TezosSignedTx = {
    signature: string;
    sig_op_contents: string;
    operation_hash: string;
};

// experimental_message
export type experimental_message = {};

// experimental_field
export type experimental_field = {};

// custom connect definitions
export type MessageType = {
    BinanceGetAddress: BinanceGetAddress;
    BinanceAddress: BinanceAddress;
    BinanceGetPublicKey: BinanceGetPublicKey;
    BinancePublicKey: BinancePublicKey;
    BinanceSignTx: BinanceSignTx;
    BinanceTxRequest: BinanceTxRequest;
    BinanceCoin: BinanceCoin;
    BinanceInputOutput: BinanceInputOutput;
    BinanceTransferMsg: BinanceTransferMsg;
    BinanceOrderMsg: BinanceOrderMsg;
    BinanceCancelMsg: BinanceCancelMsg;
    BinanceSignedTx: BinanceSignedTx;
    HDNodeType: HDNodeType;
    HDNodePathType: HDNodePathType;
    MultisigRedeemScriptType: MultisigRedeemScriptType;
    GetPublicKey: GetPublicKey;
    PublicKey: PublicKey;
    GetAddress: GetAddress;
    Address: Address;
    GetOwnershipId: GetOwnershipId;
    OwnershipId: OwnershipId;
    SignMessage: SignMessage;
    MessageSignature: MessageSignature;
    VerifyMessage: VerifyMessage;
    CoinJoinRequest: CoinJoinRequest;
    SignTx: SignTx;
    TxRequestDetailsType: TxRequestDetailsType;
    TxRequestSerializedType: TxRequestSerializedType;
    TxRequest: TxRequest;
    TxInputType: TxInputType;
    TxOutputBinType: TxOutputBinType;
    TxOutputType: TxOutputType;
    PrevTx: PrevTx;
    PrevInput: PrevInput;
    PrevOutput: PrevOutput;
    TextMemo: TextMemo;
    RefundMemo: RefundMemo;
    CoinPurchaseMemo: CoinPurchaseMemo;
    PaymentRequestMemo: PaymentRequestMemo;
    TxAckPaymentRequest: TxAckPaymentRequest;
    TxAck: TxAck;
    TxAckInputWrapper: TxAckInputWrapper;
    TxAckInput: TxAckInput;
    TxAckOutputWrapper: TxAckOutputWrapper;
    TxAckOutput: TxAckOutput;
    TxAckPrevMeta: TxAckPrevMeta;
    TxAckPrevInputWrapper: TxAckPrevInputWrapper;
    TxAckPrevInput: TxAckPrevInput;
    TxAckPrevOutputWrapper: TxAckPrevOutputWrapper;
    TxAckPrevOutput: TxAckPrevOutput;
    TxAckPrevExtraDataWrapper: TxAckPrevExtraDataWrapper;
    TxAckPrevExtraData: TxAckPrevExtraData;
    GetOwnershipProof: GetOwnershipProof;
    OwnershipProof: OwnershipProof;
    AuthorizeCoinJoin: AuthorizeCoinJoin;
    FirmwareErase: FirmwareErase;
    FirmwareRequest: FirmwareRequest;
    FirmwareUpload: FirmwareUpload;
    SelfTest: SelfTest;
    CardanoBlockchainPointerType: CardanoBlockchainPointerType;
    CardanoNativeScript: CardanoNativeScript;
    CardanoGetNativeScriptHash: CardanoGetNativeScriptHash;
    CardanoNativeScriptHash: CardanoNativeScriptHash;
    CardanoAddressParametersType: CardanoAddressParametersType;
    CardanoGetAddress: CardanoGetAddress;
    CardanoAddress: CardanoAddress;
    CardanoGetPublicKey: CardanoGetPublicKey;
    CardanoPublicKey: CardanoPublicKey;
    CardanoSignTxInit: CardanoSignTxInit;
    CardanoTxInput: CardanoTxInput;
    CardanoTxOutput: CardanoTxOutput;
    CardanoAssetGroup: CardanoAssetGroup;
    CardanoToken: CardanoToken;
    CardanoTxInlineDatumChunk: CardanoTxInlineDatumChunk;
    CardanoTxReferenceScriptChunk: CardanoTxReferenceScriptChunk;
    CardanoPoolOwner: CardanoPoolOwner;
    CardanoPoolRelayParameters: CardanoPoolRelayParameters;
    CardanoPoolMetadataType: CardanoPoolMetadataType;
    CardanoPoolParametersType: CardanoPoolParametersType;
    CardanoTxCertificate: CardanoTxCertificate;
    CardanoTxWithdrawal: CardanoTxWithdrawal;
    CardanoCVoteRegistrationDelegation: CardanoCVoteRegistrationDelegation;
    CardanoCVoteRegistrationParametersType: CardanoCVoteRegistrationParametersType;
    CardanoTxAuxiliaryData: CardanoTxAuxiliaryData;
    CardanoTxMint: CardanoTxMint;
    CardanoTxCollateralInput: CardanoTxCollateralInput;
    CardanoTxRequiredSigner: CardanoTxRequiredSigner;
    CardanoTxReferenceInput: CardanoTxReferenceInput;
    CardanoTxItemAck: CardanoTxItemAck;
    CardanoTxAuxiliaryDataSupplement: CardanoTxAuxiliaryDataSupplement;
    CardanoTxWitnessRequest: CardanoTxWitnessRequest;
    CardanoTxWitnessResponse: CardanoTxWitnessResponse;
    CardanoTxHostAck: CardanoTxHostAck;
    CardanoTxBodyHash: CardanoTxBodyHash;
    CardanoSignTxFinished: CardanoSignTxFinished;
    CardanoSignMessageInit: CardanoSignMessageInit;
    CardanoMessageItemAck: CardanoMessageItemAck;
    CardanoMessagePayloadChunk: CardanoMessagePayloadChunk;
    CardanoMessageItemHostAck: CardanoMessageItemHostAck;
    CardanoSignMessageFinished: CardanoSignMessageFinished;
    Success: Success;
    Failure: Failure;
    ButtonRequest: ButtonRequest;
    ButtonAck: ButtonAck;
    PinMatrixRequest: PinMatrixRequest;
    PinMatrixAck: PinMatrixAck;
    PassphraseRequest: PassphraseRequest;
    PassphraseAck: PassphraseAck;
    Deprecated_PassphraseStateRequest: Deprecated_PassphraseStateRequest;
    Deprecated_PassphraseStateAck: Deprecated_PassphraseStateAck;
    CipherKeyValue: CipherKeyValue;
    CipheredKeyValue: CipheredKeyValue;
    IdentityType: IdentityType;
    SignIdentity: SignIdentity;
    SignedIdentity: SignedIdentity;
    GetECDHSessionKey: GetECDHSessionKey;
    ECDHSessionKey: ECDHSessionKey;
    DebugLinkResetDebugEvents: DebugLinkResetDebugEvents;
    EosGetPublicKey: EosGetPublicKey;
    EosPublicKey: EosPublicKey;
    EosTxHeader: EosTxHeader;
    EosSignTx: EosSignTx;
    EosTxActionRequest: EosTxActionRequest;
    EosAsset: EosAsset;
    EosPermissionLevel: EosPermissionLevel;
    EosAuthorizationKey: EosAuthorizationKey;
    EosAuthorizationAccount: EosAuthorizationAccount;
    EosAuthorizationWait: EosAuthorizationWait;
    EosAuthorization: EosAuthorization;
    EosActionCommon: EosActionCommon;
    EosActionTransfer: EosActionTransfer;
    EosActionDelegate: EosActionDelegate;
    EosActionUndelegate: EosActionUndelegate;
    EosActionRefund: EosActionRefund;
    EosActionBuyRam: EosActionBuyRam;
    EosActionBuyRamBytes: EosActionBuyRamBytes;
    EosActionSellRam: EosActionSellRam;
    EosActionVoteProducer: EosActionVoteProducer;
    EosActionUpdateAuth: EosActionUpdateAuth;
    EosActionDeleteAuth: EosActionDeleteAuth;
    EosActionLinkAuth: EosActionLinkAuth;
    EosActionUnlinkAuth: EosActionUnlinkAuth;
    EosActionNewAccount: EosActionNewAccount;
    EosActionUnknown: EosActionUnknown;
    EosTxActionAck: EosTxActionAck;
    EosSignedTx: EosSignedTx;
    EthereumNetworkInfo: EthereumNetworkInfo;
    EthereumTokenInfo: EthereumTokenInfo;
    EthereumDefinitions: EthereumDefinitions;
    EthereumSignTypedData: EthereumSignTypedData;
    EthereumTypedDataStructRequest: EthereumTypedDataStructRequest;
    EthereumFieldType: EthereumFieldType;
    EthereumStructMember: EthereumStructMember;
    EthereumTypedDataStructAck: EthereumTypedDataStructAck;
    EthereumTypedDataValueRequest: EthereumTypedDataValueRequest;
    EthereumTypedDataValueAck: EthereumTypedDataValueAck;
    EthereumGetPublicKey: EthereumGetPublicKey;
    EthereumPublicKey: EthereumPublicKey;
    EthereumGetAddress: EthereumGetAddress;
    EthereumAddress: EthereumAddress;
    EthereumSignTx: EthereumSignTx;
    EthereumAccessList: EthereumAccessList;
    EthereumSignTxEIP1559: EthereumSignTxEIP1559;
    EthereumTxRequest: EthereumTxRequest;
    EthereumTxAck: EthereumTxAck;
    EthereumSignMessage: EthereumSignMessage;
    EthereumMessageSignature: EthereumMessageSignature;
    EthereumVerifyMessage: EthereumVerifyMessage;
    EthereumSignTypedHash: EthereumSignTypedHash;
    EthereumTypedDataSignature: EthereumTypedDataSignature;
    Initialize: Initialize;
    GetFeatures: GetFeatures;
    Features: Features;
    LockDevice: LockDevice;
    SetBusy: SetBusy;
    EndSession: EndSession;
    ApplySettings: ApplySettings;
    ChangeLanguage: ChangeLanguage;
    TranslationDataRequest: TranslationDataRequest;
    TranslationDataAck: TranslationDataAck;
    ApplyFlags: ApplyFlags;
    ChangePin: ChangePin;
    ChangeWipeCode: ChangeWipeCode;
    SdProtect: SdProtect;
    Ping: Ping;
    Cancel: Cancel;
    GetEntropy: GetEntropy;
    Entropy: Entropy;
    GetFirmwareHash: GetFirmwareHash;
    FirmwareHash: FirmwareHash;
    AuthenticateDevice: AuthenticateDevice;
    AuthenticityProof: AuthenticityProof;
    WipeDevice: WipeDevice;
    ResetDevice: ResetDevice;
    BackupDevice: BackupDevice;
    EntropyRequest: EntropyRequest;
    EntropyAck: EntropyAck;
    RecoveryDevice: RecoveryDevice;
    WordRequest: WordRequest;
    WordAck: WordAck;
    SetU2FCounter: SetU2FCounter;
    GetNextU2FCounter: GetNextU2FCounter;
    NextU2FCounter: NextU2FCounter;
    DoPreauthorized: DoPreauthorized;
    PreauthorizedRequest: PreauthorizedRequest;
    CancelAuthorization: CancelAuthorization;
    RebootToBootloader: RebootToBootloader;
    GetNonce: GetNonce;
    Nonce: Nonce;
    UnlockPath: UnlockPath;
    UnlockedPathRequest: UnlockedPathRequest;
    ShowDeviceTutorial: ShowDeviceTutorial;
    UnlockBootloader: UnlockBootloader;
    NEMGetAddress: NEMGetAddress;
    NEMAddress: NEMAddress;
    NEMTransactionCommon: NEMTransactionCommon;
    NEMMosaic: NEMMosaic;
    NEMTransfer: NEMTransfer;
    NEMProvisionNamespace: NEMProvisionNamespace;
    NEMMosaicDefinition: NEMMosaicDefinition;
    NEMMosaicCreation: NEMMosaicCreation;
    NEMMosaicSupplyChange: NEMMosaicSupplyChange;
    NEMCosignatoryModification: NEMCosignatoryModification;
    NEMAggregateModification: NEMAggregateModification;
    NEMImportanceTransfer: NEMImportanceTransfer;
    NEMSignTx: NEMSignTx;
    NEMSignedTx: NEMSignedTx;
    NEMDecryptMessage: NEMDecryptMessage;
    NEMDecryptedMessage: NEMDecryptedMessage;
    RippleGetAddress: RippleGetAddress;
    RippleAddress: RippleAddress;
    RipplePayment: RipplePayment;
    RippleSignTx: RippleSignTx;
    RippleSignedTx: RippleSignedTx;
    SolanaGetPublicKey: SolanaGetPublicKey;
    SolanaPublicKey: SolanaPublicKey;
    SolanaGetAddress: SolanaGetAddress;
    SolanaAddress: SolanaAddress;
    SolanaTxTokenAccountInfo: SolanaTxTokenAccountInfo;
    SolanaTxAdditionalInfo: SolanaTxAdditionalInfo;
    SolanaSignTx: SolanaSignTx;
    SolanaTxSignature: SolanaTxSignature;
    StellarAsset: StellarAsset;
    StellarGetAddress: StellarGetAddress;
    StellarAddress: StellarAddress;
    StellarSignTx: StellarSignTx;
    StellarTxOpRequest: StellarTxOpRequest;
    StellarPaymentOp: StellarPaymentOp;
    StellarCreateAccountOp: StellarCreateAccountOp;
    StellarPathPaymentStrictReceiveOp: StellarPathPaymentStrictReceiveOp;
    StellarPathPaymentStrictSendOp: StellarPathPaymentStrictSendOp;
    StellarManageSellOfferOp: StellarManageSellOfferOp;
    StellarManageBuyOfferOp: StellarManageBuyOfferOp;
    StellarCreatePassiveSellOfferOp: StellarCreatePassiveSellOfferOp;
    StellarSetOptionsOp: StellarSetOptionsOp;
    StellarChangeTrustOp: StellarChangeTrustOp;
    StellarAllowTrustOp: StellarAllowTrustOp;
    StellarAccountMergeOp: StellarAccountMergeOp;
    StellarManageDataOp: StellarManageDataOp;
    StellarBumpSequenceOp: StellarBumpSequenceOp;
    StellarSignedTx: StellarSignedTx;
    TezosGetAddress: TezosGetAddress;
    TezosAddress: TezosAddress;
    TezosGetPublicKey: TezosGetPublicKey;
    TezosPublicKey: TezosPublicKey;
    TezosContractID: TezosContractID;
    TezosRevealOp: TezosRevealOp;
    TezosManagerTransfer: TezosManagerTransfer;
    TezosParametersManager: TezosParametersManager;
    TezosTransactionOp: TezosTransactionOp;
    TezosOriginationOp: TezosOriginationOp;
    TezosDelegationOp: TezosDelegationOp;
    TezosProposalOp: TezosProposalOp;
    TezosBallotOp: TezosBallotOp;
    TezosSignTx: TezosSignTx;
    TezosSignedTx: TezosSignedTx;
    experimental_message: experimental_message;
    experimental_field: experimental_field;
};

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
