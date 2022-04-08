// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoSignTransaction.js

/* eslint-disable no-restricted-syntax */
import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { getMiscNetwork } from '../data/coinInfo';
import { validatePath } from '../utils/pathUtils';
import {
    modifyAuxiliaryDataForBackwardsCompatibility,
    transformAuxiliaryData,
} from './cardano/cardanoAuxiliaryData';
import { transformCertificate } from './cardano/cardanoCertificate';
import type { CertificateWithPoolOwnersAndRelays } from './cardano/cardanoCertificate';
import type { Path, InputWithPath, CollateralInputWithPath } from './cardano/cardanoInputs';
import { transformInput, transformCollateralInput } from './cardano/cardanoInputs';
import { transformOutput } from './cardano/cardanoOutputs';
import type { OutputWithTokens } from './cardano/cardanoOutputs';
import { legacySerializedTxToResult, toLegacyParams } from './cardano/cardanoSignTxLegacy';
import { PROTO, ERRORS } from '../constants';
import type {
    CardanoAuxiliaryDataSupplement,
    CardanoSignedTxData,
    CardanoSignedTxWitness,
} from '../types/api/cardanoSignTransaction';
import { gatherWitnessPaths } from './cardano/cardanoWitnesses';
import type { AssetGroupWithTokens } from './cardano/cardanoTokenBundle';
import { tokenBundleToProto } from './cardano/cardanoTokenBundle';

// todo: remove when listed firmwares become mandatory for cardanoSignTransaction
const CardanoSignTransactionFeatures = Object.freeze({
    SignStakePoolRegistrationAsOwner: ['0', '2.3.5'],
    ValidityIntervalStart: ['0', '2.3.5'],
    MultiassetOutputs: ['0', '2.3.5'],
    AuxiliaryData: ['0', '2.3.7'],
    ZeroTTL: ['0', '2.4.2'],
    ZeroValidityIntervalStart: ['0', '2.4.2'],
    TransactionStreaming: ['0', '2.4.2'],
    AuxiliaryDataHash: ['0', '2.4.2'],
    TokenMinting: ['0', '2.4.3'],
    Multisig: ['0', '2.4.3'],
    NetworkIdInTxBody: ['0', '2.4.4'],
    OutputDatumHash: ['0', '2.4.4'],
    ScriptDataHash: ['0', '2.4.4'],
    Plutus: ['0', '2.4.4'],
    KeyHashStakeCredential: ['0', '2.4.4'],
});

export type CardanoSignTransactionParams = {
    signingMode: PROTO.CardanoTxSigningMode;
    inputsWithPath: InputWithPath[];
    outputsWithTokens: OutputWithTokens[];
    fee: PROTO.UintType;
    ttl?: PROTO.UintType;
    certificatesWithPoolOwnersAndRelays: CertificateWithPoolOwnersAndRelays[];
    withdrawals: PROTO.CardanoTxWithdrawal[];
    mint: AssetGroupWithTokens[];
    auxiliaryData?: PROTO.CardanoTxAuxiliaryData;
    validityIntervalStart?: PROTO.UintType;
    scriptDataHash?: string;
    collateralInputsWithPath: CollateralInputWithPath[];
    requiredSigners: PROTO.CardanoTxRequiredSigner[];
    protocolMagic: number;
    networkId: number;
    witnessPaths: Path[];
    additionalWitnessRequests: Path[];
    derivationType: PROTO.CardanoDerivationType;
    includeNetworkId?: boolean;
};

export default class CardanoSignTransaction extends AbstractMethod<
    'cardanoSignTransaction',
    CardanoSignTransactionParams
> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Cardano'),
            this.firmwareRange,
        );
        this.info = 'Sign Cardano transaction';

        const { payload } = this;

        // @ts-expect-error payload.metadata is a legacy param
        if (payload.metadata) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Metadata field has been replaced by auxiliaryData.',
            );
        }

        // @ts-expect-error payload.auxiliaryData.blob is a legacy param
        if (payload.auxiliaryData && payload.auxiliaryData.blob) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Auxiliary data can now only be sent as a hash.',
            );
        }

        // validate incoming parameters
        validateParams(payload, [
            { name: 'signingMode', type: 'number', required: true },
            { name: 'inputs', type: 'array', required: true },
            { name: 'outputs', type: 'array', required: true, allowEmpty: true },
            { name: 'fee', type: 'uint', required: true },
            { name: 'ttl', type: 'uint' },
            { name: 'certificates', type: 'array', allowEmpty: true },
            { name: 'withdrawals', type: 'array', allowEmpty: true },
            { name: 'mint', type: 'array', allowEmpty: true },
            { name: 'validityIntervalStart', type: 'uint' },
            { name: 'scriptDataHash', type: 'string' },
            { name: 'collateralInputs', type: 'array', allowEmpty: true },
            { name: 'requiredSigners', type: 'array', allowEmpty: true },
            { name: 'protocolMagic', type: 'number', required: true },
            { name: 'networkId', type: 'number', required: true },
            { name: 'additionalWitnessRequests', type: 'array', allowEmpty: true },
            { name: 'derivationType', type: 'number' },
            { name: 'includeNetworkId', type: 'boolean' },
        ]);

        const inputsWithPath = payload.inputs.map(transformInput);

        const outputsWithTokens = payload.outputs.map(transformOutput);

        let certificatesWithPoolOwnersAndRelays: CertificateWithPoolOwnersAndRelays[] = [];
        if (payload.certificates) {
            certificatesWithPoolOwnersAndRelays = payload.certificates.map(transformCertificate);
        }

        let withdrawals: PROTO.CardanoTxWithdrawal[] = [];
        if (payload.withdrawals) {
            withdrawals = payload.withdrawals.map(withdrawal => {
                validateParams(withdrawal, [
                    { name: 'amount', type: 'uint', required: true },
                    { name: 'scriptHash', type: 'string' },
                    { name: 'keyHash', type: 'string' },
                ]);
                return {
                    path: withdrawal.path ? validatePath(withdrawal.path, 5) : undefined,
                    amount: withdrawal.amount,
                    script_hash: withdrawal.scriptHash,
                    key_hash: withdrawal.keyHash,
                };
            });
        }

        let mint: AssetGroupWithTokens[] = [];
        if (payload.mint) {
            mint = tokenBundleToProto(payload.mint);
        }

        let auxiliaryData;
        if (payload.auxiliaryData) {
            auxiliaryData = transformAuxiliaryData(payload.auxiliaryData);
        }

        let additionalWitnessRequests: Path[] = [];
        if (payload.additionalWitnessRequests) {
            additionalWitnessRequests = payload.additionalWitnessRequests.map(witnessRequest =>
                validatePath(witnessRequest, 3),
            );
        }

        let collateralInputsWithPath: CollateralInputWithPath[] = [];
        if (payload.collateralInputs) {
            collateralInputsWithPath = payload.collateralInputs.map(transformCollateralInput);
        }

        let requiredSigners: PROTO.CardanoTxRequiredSigner[] = [];
        if (payload.requiredSigners) {
            requiredSigners = payload.requiredSigners.map(requiredSigner => {
                validateParams(requiredSigner, [{ name: 'keyHash', type: 'string' }]);
                return {
                    key_path: requiredSigner.keyPath
                        ? validatePath(requiredSigner.keyPath, 3)
                        : undefined,
                    key_hash: requiredSigner.keyHash,
                } as PROTO.CardanoTxRequiredSigner;
            });
        }

        this.params = {
            signingMode: payload.signingMode,
            inputsWithPath,
            outputsWithTokens,
            fee: payload.fee,
            ttl: payload.ttl,
            certificatesWithPoolOwnersAndRelays,
            withdrawals,
            mint,
            auxiliaryData,
            validityIntervalStart: payload.validityIntervalStart,
            scriptDataHash: payload.scriptDataHash,
            collateralInputsWithPath,
            requiredSigners,
            protocolMagic: payload.protocolMagic,
            networkId: payload.networkId,
            witnessPaths: gatherWitnessPaths(
                inputsWithPath,
                certificatesWithPoolOwnersAndRelays,
                withdrawals,
                collateralInputsWithPath,
                requiredSigners,
                additionalWitnessRequests,
                payload.signingMode,
            ),
            additionalWitnessRequests,
            derivationType:
                typeof payload.derivationType !== 'undefined'
                    ? payload.derivationType
                    : PROTO.CardanoDerivationType.ICARUS_TREZOR,
            includeNetworkId: payload.includeNetworkId,
        };
    }

    _isFeatureSupported(feature: keyof typeof CardanoSignTransactionFeatures) {
        return this.device.atLeast(CardanoSignTransactionFeatures[feature]);
    }

    _ensureFeatureIsSupported(feature: keyof typeof CardanoSignTransactionFeatures) {
        if (!this._isFeatureSupported(feature)) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Feature ${feature} not supported by device firmware`,
            );
        }
    }

    _ensureFirmwareSupportsParams() {
        const { params } = this;

        params.certificatesWithPoolOwnersAndRelays.forEach(({ certificate }) => {
            if (certificate.type === PROTO.CardanoCertificateType.STAKE_POOL_REGISTRATION) {
                this._ensureFeatureIsSupported('SignStakePoolRegistrationAsOwner');
            }

            if (certificate.key_hash) {
                this._ensureFeatureIsSupported('KeyHashStakeCredential');
            }
        });

        if (params.validityIntervalStart != null) {
            this._ensureFeatureIsSupported('ValidityIntervalStart');
        }

        params.outputsWithTokens.forEach(({ output, tokenBundle }) => {
            if (tokenBundle && tokenBundle.length > 0) {
                this._ensureFeatureIsSupported('MultiassetOutputs');
            }

            if (output.datum_hash) {
                this._ensureFeatureIsSupported('OutputDatumHash');
            }
        });

        params.withdrawals.forEach(withdrawal => {
            if (withdrawal.key_hash) {
                this._ensureFeatureIsSupported('KeyHashStakeCredential');
            }
        });

        if (params.auxiliaryData) {
            this._ensureFeatureIsSupported('AuxiliaryData');
        }

        if (params.ttl === '0') {
            this._ensureFeatureIsSupported('ZeroTTL');
        }

        if (params.validityIntervalStart === '0') {
            this._ensureFeatureIsSupported('ZeroValidityIntervalStart');
        }

        if (params.auxiliaryData && params.auxiliaryData.hash) {
            this._ensureFeatureIsSupported('AuxiliaryDataHash');
        }

        if (params.mint.length > 0) {
            this._ensureFeatureIsSupported('TokenMinting');
        }

        if (
            params.additionalWitnessRequests.length > 0 ||
            params.signingMode === PROTO.CardanoTxSigningMode.MULTISIG_TRANSACTION
        ) {
            this._ensureFeatureIsSupported('Multisig');
        }

        if (params.includeNetworkId) {
            this._ensureFeatureIsSupported('NetworkIdInTxBody');
        }

        if (params.scriptDataHash) {
            this._ensureFeatureIsSupported('ScriptDataHash');
        }

        if (params.signingMode === PROTO.CardanoTxSigningMode.PLUTUS_TRANSACTION) {
            this._ensureFeatureIsSupported('Plutus');
        }
    }

    async _sign_tx(): Promise<CardanoSignedTxData> {
        const typedCall = this.device.getCommands().typedCall.bind(this.device.getCommands());

        const hasAuxiliaryData = !!this.params.auxiliaryData;

        const signTxInitMessage = {
            signing_mode: this.params.signingMode,
            protocol_magic: this.params.protocolMagic,
            network_id: this.params.networkId,
            inputs_count: this.params.inputsWithPath.length,
            outputs_count: this.params.outputsWithTokens.length,
            fee: this.params.fee,
            ttl: this.params.ttl,
            certificates_count: this.params.certificatesWithPoolOwnersAndRelays.length,
            withdrawals_count: this.params.withdrawals.length,
            has_auxiliary_data: hasAuxiliaryData,
            validity_interval_start: this.params.validityIntervalStart,
            witness_requests_count: this.params.witnessPaths.length,
            minting_asset_groups_count: this.params.mint.length,
            script_data_hash: this.params.scriptDataHash,
            collateral_inputs_count: this.params.collateralInputsWithPath.length,
            required_signers_count: this.params.requiredSigners.length,
            derivation_type: this.params.derivationType,
            include_network_id: this.params.includeNetworkId,
        };

        // init
        await typedCall('CardanoSignTxInit', 'CardanoTxItemAck', signTxInitMessage);
        // inputs
        for (const { input } of this.params.inputsWithPath) {
            await typedCall('CardanoTxInput', 'CardanoTxItemAck', input);
        }
        // outputs and tokens
        for (const { output, tokenBundle } of this.params.outputsWithTokens) {
            await typedCall('CardanoTxOutput', 'CardanoTxItemAck', output);
            if (tokenBundle) {
                for (const assetGroup of tokenBundle) {
                    await typedCall('CardanoAssetGroup', 'CardanoTxItemAck', {
                        policy_id: assetGroup.policyId,
                        tokens_count: assetGroup.tokens.length,
                    });
                    for (const token of assetGroup.tokens) {
                        await typedCall('CardanoToken', 'CardanoTxItemAck', token);
                    }
                }
            }
        }
        // certificates, owners and relays
        for (const { certificate, poolOwners, poolRelays } of this.params
            .certificatesWithPoolOwnersAndRelays) {
            await typedCall('CardanoTxCertificate', 'CardanoTxItemAck', certificate);
            for (const poolOwner of poolOwners) {
                await typedCall('CardanoPoolOwner', 'CardanoTxItemAck', poolOwner);
            }
            for (const poolRelay of poolRelays) {
                await typedCall('CardanoPoolRelayParameters', 'CardanoTxItemAck', poolRelay);
            }
        }
        // withdrawals
        for (const withdrawal of this.params.withdrawals) {
            await typedCall('CardanoTxWithdrawal', 'CardanoTxItemAck', withdrawal);
        }
        // auxiliary data
        let auxiliaryDataSupplement: CardanoAuxiliaryDataSupplement | undefined;
        if (this.params.auxiliaryData) {
            const { catalyst_registration_parameters } = this.params.auxiliaryData;
            if (catalyst_registration_parameters) {
                this.params.auxiliaryData = modifyAuxiliaryDataForBackwardsCompatibility(
                    this.device,
                    this.params.auxiliaryData,
                );
            }

            const { message } = await typedCall(
                'CardanoTxAuxiliaryData',
                'CardanoTxAuxiliaryDataSupplement',
                this.params.auxiliaryData,
            );

            // TODO: https://github.com/trezor/trezor-suite/issues/5299
            const auxiliaryDataType: any = PROTO.CardanoTxAuxiliaryDataSupplementType[message.type];
            if (auxiliaryDataType !== PROTO.CardanoTxAuxiliaryDataSupplementType.NONE) {
                auxiliaryDataSupplement = {
                    type: auxiliaryDataType,
                    auxiliaryDataHash: message.auxiliary_data_hash!,
                    catalystSignature: message.catalyst_signature,
                };
            }
            await typedCall('CardanoTxHostAck', 'CardanoTxItemAck');
        }
        // mint
        if (this.params.mint.length > 0) {
            await typedCall('CardanoTxMint', 'CardanoTxItemAck', {
                asset_groups_count: this.params.mint.length,
            });
            for (const assetGroup of this.params.mint) {
                await typedCall('CardanoAssetGroup', 'CardanoTxItemAck', {
                    policy_id: assetGroup.policyId,
                    tokens_count: assetGroup.tokens.length,
                });
                for (const token of assetGroup.tokens) {
                    await typedCall('CardanoToken', 'CardanoTxItemAck', token);
                }
            }
        }
        // collateral inputs
        for (const { collateralInput } of this.params.collateralInputsWithPath) {
            await typedCall('CardanoTxCollateralInput', 'CardanoTxItemAck', collateralInput);
        }
        // required signers
        for (const requiredSigner of this.params.requiredSigners) {
            await typedCall('CardanoTxRequiredSigner', 'CardanoTxItemAck', requiredSigner);
        }
        // witnesses
        const witnesses: CardanoSignedTxWitness[] = [];
        for (const path of this.params.witnessPaths) {
            const { message } = await typedCall(
                'CardanoTxWitnessRequest',
                'CardanoTxWitnessResponse',
                { path },
            );
            witnesses.push({
                type: PROTO.CardanoTxWitnessType[message.type] as any, // TODO: https://github.com/trezor/trezor-suite/issues/5299
                pubKey: message.pub_key,
                signature: message.signature,
                chainCode: message.chain_code,
            });
        }
        // tx hash
        const { message: txBodyHashMessage } = await typedCall(
            'CardanoTxHostAck',
            'CardanoTxBodyHash',
        );
        // finish
        await typedCall('CardanoTxHostAck', 'CardanoSignTxFinished');

        return { hash: txBodyHashMessage.tx_hash, witnesses, auxiliaryDataSupplement };
    }

    async _sign_tx_legacy(): Promise<CardanoSignedTxData> {
        const typedCall = this.device.getCommands().typedCall.bind(this.device.getCommands());

        const legacyParams = toLegacyParams(this.device, this.params);

        let serializedTx = '';

        let r = await typedCall(
            'CardanoSignTx',
            ['CardanoSignedTx', 'CardanoSignedTxChunk'],
            legacyParams as any, // legacy params
        );
        while (r.type === 'CardanoSignedTxChunk') {
            serializedTx += r.message.signed_tx_chunk;
            r = await typedCall('CardanoSignedTxChunkAck', [
                'CardanoSignedTx',
                'CardanoSignedTxChunk',
            ]);
        }

        // this is required for backwards compatibility for FW <= 2.3.6 when the tx was not sent in chunks yet
        // @ts-expect-error legacy params
        if (message.serialized_tx) {
            // @ts-expect-error legacy params
            serializedTx += message.serialized_tx;
        }

        // @ts-expect-error legacy params
        return legacySerializedTxToResult(message.tx_hash, serializedTx);
    }

    run() {
        this._ensureFirmwareSupportsParams();

        if (!this._isFeatureSupported('TransactionStreaming')) {
            return this._sign_tx_legacy();
        }

        return this._sign_tx();
    }
}
