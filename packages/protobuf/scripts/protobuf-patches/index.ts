import fs from 'fs';
import path from 'path';

export const UINT_TYPE = 'UintType';
export const SINT_TYPE = 'SintType';
const DeviceModelInternal = 'DeviceModelInternal';

// proto types to javascript types
export const FIELD_TYPES = {
    uint32: 'number',
    uint64: 'number',
    sint32: 'number',
    sint64: 'number',
    bool: 'boolean',
    bytes: 'string',
    // 'bytes': 'Uint8Array | number[] | Buffer | string', // protobuf will handle conversion
};

// Types needs reordering (used before defined).
// The Type in the Value NEEDs (depends on) the Type in the Key.
export const ORDER = {
    BinanceCoin: 'BinanceInputOutput',
    HDNodeType: 'HDNodePathType',
    TxAck: 'TxAckInputWrapper',
    EthereumFieldType: 'EthereumStructMember',
    EthereumDataType: 'EthereumFieldType',
    PaymentRequestMemo: 'TxAckPaymentRequest',
    RecoveryDevice: 'Features',
    RecoveryType: 'RecoveryDevice',
    RecoveryDeviceInputMethod: 'RecoveryType',
};

// enums used as keys (string), used as values (number) by default
export const ENUM_KEYS = [
    'InputScriptType',
    'OutputScriptType',
    'RequestType',
    'BackupType',
    'Capability',
    'SafetyCheckLevel',
    'ButtonRequestType',
    'PinMatrixRequestType',
    'WordRequestType',
    'HomescreenFormat',
    'RecoveryStatus',
    'BackupAvailability',
    'RecoveryType',
];

// type rule fixes, ideally it should not be here
export const RULE_PATCH = {
    'BackupDevice.groups': 'optional', // protobuf repeated bytes are always optional (fallback to [])
    'MultisigRedeemScriptType.nodes': 'optional', // its valid to be undefined according to implementation/tests
    'MultisigRedeemScriptType.address_n': 'optional', // its valid to be undefined according to implementation/tests
    'TxRequestDetailsType.request_index': 'required',
    'TxRequest.request_type': 'required',
    'TxRequest.details': 'required',
    'TxAckPaymentRequest.memos': 'optional', // protobuf repeated bytes are always optional (fallback to [])
    'CardanoPoolOwnerType.staking_key_path': 'optional',
    'CardanoPoolOwner.staking_key_path': 'optional',
    'CardanoTxCertificateType.path': 'optional',
    'CardanoTxCertificate.path': 'optional',
    'CardanoTxInputType.address_n': 'optional',
    'CardanoTxWithdrawal.path': 'optional',
    'CardanoNativeScript.scripts': 'optional',
    'CardanoNativeScript.key_path': 'optional',
    'CardanoTxRequiredSigner.key_path': 'optional',
    'CardanoCVoteRegistrationParametersType.delegations': 'optional',
    'Success.message': 'required', // didn't find use case where it's not sent
    'SignedIdentity.address': 'required',
    'EosAuthorizationKey.key': 'required', // its valid to be undefined according to implementation/tests
    'EosAuthorizationKey.type': 'optional', // its valid to be undefined according to implementation/tests
    'EosAuthorizationKey.address_n': 'optional', // its valid to be undefined according to implementation/tests
    'EthereumAddress.address': 'required', // address is transformed from legacy type _old_address
    // TODO: Features should be union: bootloader|normal
    // fields below are marked as required because of backward compatibility (suite implementation)
    'Features.vendor': 'required',
    'Features.bootloader_mode': 'required',
    'Features.device_id': 'required',
    'Features.major_version': 'required',
    'Features.minor_version': 'required',
    'Features.patch_version': 'required',
    'Features.pin_protection': 'required',
    'Features.passphrase_protection': 'required',
    'Features.language': 'required',
    'Features.label': 'required',
    'Features.initialized': 'required',
    'Features.revision': 'required',
    'Features.bootloader_hash': 'required',
    'Features.imported': 'required',
    'Features.unlocked': 'required',
    'Features.firmware_present': 'required',
    'Features.backup_availability': 'required',
    'Features.flags': 'required',
    'Features.fw_major': 'required',
    'Features.fw_minor': 'required',
    'Features.fw_patch': 'required',
    'Features.fw_vendor': 'required',
    'Features.model': 'required',
    'Features.internal_model': 'required',
    'Features.unfinished_backup': 'required',
    'Features.no_backup': 'required',
    'Features.recovery_status': 'required',
    'Features.backup_type': 'required',
    'Features.sd_card_present': 'required',
    'Features.sd_protection': 'required',
    'Features.wipe_code_protection': 'required',
    'Features.session_id': 'required',
    'Features.passphrase_always_on_device': 'required',
    'Features.safety_checks': 'required',
    'Features.auto_lock_delay_ms': 'required',
    'Features.display_rotation': 'required',
    'Features.experimental_features': 'required',
    'GetOwnershipProof.ownership_ids': 'optional', // protobuf repeated bytes are always optional (fallback to [])
    'NEMTransactionCommon.address_n': 'optional', // no address_n in multisig
    'NEMTransfer.mosaics': 'optional', // its valid to be undefined according to implementation/tests
    'NEMMosaicDefinition.networks': 'optional', // never used according to implementation/tests
    'NEMAggregateModification.modifications': 'optional', // its valid to be undefined according to implementation/tests
    'StellarAssetType.code': 'required',
    'StellarPathPaymentStrictReceiveOp.paths': 'optional', // its valid to be undefined according to implementation/tests
    'StellarPathPaymentStrictSendOp.paths': 'optional', // its valid to be undefined according to implementation/tests
};

// custom types IN to trezor
// protobuf lib will handle the translation to required type
// connect or other 3rd party libs are using compatible types (string as number etc...)
export const TYPE_PATCH = {
    'Features.bootloader_mode': 'boolean | null',
    'Features.device_id': 'string | null',
    'Features.pin_protection': 'boolean | null',
    'Features.passphrase_protection': 'boolean | null',
    'Features.language': 'string | null',
    'Features.label': 'string | null',
    'Features.initialized': 'boolean | null',
    'Features.revision': 'string | null',
    'Features.bootloader_hash': 'string | null',
    'Features.imported': 'boolean | null',
    'Features.unlocked': 'boolean | null',
    'Features.firmware_present': 'boolean | null',
    'Features.backup_availability': 'BackupAvailability | null',
    'Features.flags': 'number | null',
    'Features.fw_major': 'number | null',
    'Features.fw_minor': 'number | null',
    'Features.fw_patch': 'number | null',
    'Features.fw_vendor': 'string | null',
    'Features.unfinished_backup': 'boolean | null',
    'Features.no_backup': 'boolean | null',
    'Features.recovery_status': 'RecoveryStatus | null',
    'Features.backup_type': 'BackupType | null',
    'Features.sd_card_present': 'boolean | null',
    'Features.sd_protection': 'boolean | null',
    'Features.wipe_code_protection': 'boolean | null',
    'Features.session_id': 'string | null',
    'Features.passphrase_always_on_device': 'boolean | null',
    'Features.safety_checks': 'SafetyCheckLevel | null',
    'Features.auto_lock_delay_ms': 'number | null',
    'Features.display_rotation': 'number | null',
    'Features.experimental_features': 'boolean | null',
    'Features.internal_model': DeviceModelInternal,
    'HDNodePathType.node': 'HDNodeType | string',
    'FirmwareUpload.payload': 'Buffer | ArrayBuffer',
    'EthereumGetAddress.encoded_network': 'ArrayBuffer',
    'EthereumDefinitions.encoded_network': 'ArrayBuffer',
    'EthereumDefinitions.encoded_token': 'ArrayBuffer',
    'EthereumSignMessage.encoded_network': 'ArrayBuffer',
    'EthereumSignTypedHash.encoded_network': 'ArrayBuffer',
    'CardanoCVoteRegistrationDelegation.weight': UINT_TYPE,
    'CardanoCVoteRegistrationParametersType.nonce': UINT_TYPE,
    'CardanoCVoteRegistrationParametersType.voting_purpose': UINT_TYPE,
    'CardanoPoolParametersType.pledge': UINT_TYPE,
    'CardanoPoolParametersType.cost': UINT_TYPE,
    'CardanoPoolParametersType.margin_numerator': UINT_TYPE,
    'CardanoPoolParametersType.margin_denominator': UINT_TYPE,
    'CardanoTxCertificate.deposit': UINT_TYPE,
    'CardanoSignTxInit.ttl': UINT_TYPE,
    'CardanoSignTxInit.validity_interval_start': UINT_TYPE,
    'CardanoSignTxInit.total_collateral': UINT_TYPE,
    'CardanoToken.mint_amount': SINT_TYPE,
    'CardanoNativeScript.invalid_before': UINT_TYPE,
    'CardanoNativeScript.invalid_hereafter': UINT_TYPE,
    'EosAsset.symbol': 'string',
    'EosPermissionLevel.actor': 'string',
    'EosPermissionLevel.permission': 'string',
    'EosAuthorizationKey.key': 'string',
    'EosActionCommon.account': 'string',
    'EosActionCommon.name': 'string',
    'EosActionTransfer.sender': 'string',
    'EosActionTransfer.receiver': 'string',
    'EosActionDelegate.sender': 'string',
    'EosActionDelegate.receiver': 'string',
    'EosActionUndelegate.sender': 'string',
    'EosActionUndelegate.receiver': 'string',
    'EosActionRefund.owner': 'string',
    'EosActionBuyRam.payer': 'string',
    'EosActionBuyRam.receiver': 'string',
    'EosActionBuyRamBytes.payer': 'string',
    'EosActionBuyRamBytes.receiver': 'string',
    'EosActionSellRam.account': 'string',
    'EosActionVoteProducer.voter': 'string',
    'EosActionVoteProducer.proxy': 'string',
    'EosActionVoteProducer.producers': 'string',
    'EosActionUpdateAuth.account': 'string',
    'EosActionUpdateAuth.permission': 'string',
    'EosActionUpdateAuth.parent': 'string',
    'EosActionDeleteAuth.account': 'string',
    'EosActionDeleteAuth.permission': 'string',
    'EosActionLinkAuth.account': 'string',
    'EosActionLinkAuth.code': 'string',
    'EosActionLinkAuth.type': 'string',
    'EosActionLinkAuth.requirement': 'string',
    'EosActionUnlinkAuth.account': 'string',
    'EosActionUnlinkAuth.code': 'string',
    'EosActionUnlinkAuth.type': 'string',
    'EosActionNewAccount.creator': 'string',
    'EosActionNewAccount.name': 'string',
    'ResetDevice.backup_type': 'Enum_BackupType',
    'StellarAsset.type': '0 | 1 | 2  | "NATIVE" | "ALPHANUM4" | "ALPHANUM12"', // StellarAssetType is a enum, accepted as both number and string
    'StellarSignTx.sequence_number': UINT_TYPE,
    'StellarSignTx.memo_id': UINT_TYPE,
    'StellarSignTx.memo_hash': 'Buffer | string',
    'StellarCreateAccountOp.starting_balance': UINT_TYPE,
    'StellarPathPaymentStrictReceiveOp.send_max': UINT_TYPE,
    'StellarPathPaymentStrictReceiveOp.destination_amount': UINT_TYPE,
    'StellarPathPaymentStrictSendOp.send_amount': UINT_TYPE,
    'StellarPathPaymentStrictSendOp.destination_min': UINT_TYPE,
    'StellarManageSellOfferOp.offer_id': UINT_TYPE,
    'StellarManageBuyOfferOp.offer_id': UINT_TYPE,
    'StellarSetOptionsOp.master_weight': UINT_TYPE,
    'StellarSetOptionsOp.low_threshold': UINT_TYPE,
    'StellarSetOptionsOp.medium_threshold': UINT_TYPE,
    'StellarSetOptionsOp.high_threshold': UINT_TYPE,
    'StellarSetOptionsOp.signer_key': 'Buffer | string',
    'StellarChangeTrustOp.limit': UINT_TYPE,
    'StellarManageDataOp.value': 'Buffer | string',
    'StellarBumpSequenceOp.bump_to': UINT_TYPE,
    'TezosContractID.tag': 'number',
    'TezosContractID.hash': 'Uint8Array',
    'TezosRevealOp.source': 'Uint8Array',
    'TezosRevealOp.public_key': 'Uint8Array',
    'TezosParametersManager.set_delegate': 'Uint8Array',
    'TezosTransactionOp.source': 'Uint8Array',
    'TezosTransactionOp.parameters': 'number[]',
    'TezosOriginationOp.source': 'Uint8Array',
    'TezosOriginationOp.delegate': 'Uint8Array',
    'TezosOriginationOp.script': 'string | number[]',
    'TezosDelegationOp.source': 'Uint8Array',
    'TezosDelegationOp.delegate': 'Uint8Array',
    'TezosSignTx.branch': 'Uint8Array',
    'Features.recovery_type': 'RecoveryType',
};

export const readPatch = (file: string) => {
    return fs
        .readFileSync(path.join(__dirname, file), 'utf8')
        .replace(/^\/\/ @ts-nocheck.*\n?/gm, '');
};

export const DEFINITION_PATCH = {
    TxInputType: () => readPatch('./TxInputType.ts'),
    TxOutputType: () => readPatch('./TxOutputType.ts'),
    TxAck: () => readPatch('./TxAck.ts'),
};

// skip unnecessary types
export const SKIP = [
    'MessageType', // connect uses custom definition
    'TransactionType', // connect uses custom definition
    'TxInput', // declared in TxInputType patch
    'TxOutput', // declared in TxOutputType patch
    // not implemented
    'DebugSwipeDirection',
    'DebugLinkDecision',
    'DebugLinkLayout',
    'DebugLinkReseedRandom',
    'DebugLinkRecordScreen',
    'DebugLinkGetState',
    'DebugLinkState',
    'DebugLinkStop',
    'DebugLinkLog',
    'DebugLinkMemoryRead',
    'DebugLinkMemory',
    'DebugLinkMemoryWrite',
    'DebugLinkFlashErase',
    'DebugLinkEraseSdCard',
    'DebugLinkWatchLayout',
    'LoadDevice',
];
