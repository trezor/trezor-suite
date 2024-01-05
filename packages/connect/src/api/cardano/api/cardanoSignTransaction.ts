// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoSignTransaction.js

// allow for...of statements
/* eslint-disable no-restricted-syntax */

import { trezorUtils } from '@fivebinaries/coin-selection';

import { AbstractMethod } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import {
    modifyAuxiliaryDataForBackwardsCompatibility,
    transformAuxiliaryData,
} from '../cardanoAuxiliaryData';
import { transformCertificate } from '../cardanoCertificate';
import type { CertificateWithPoolOwnersAndRelays } from '../cardanoCertificate';
import {
    Path,
    InputWithPath,
    CollateralInputWithPath,
    transformReferenceInput,
    transformInput,
    transformCollateralInput,
} from '../cardanoInputs';
import { sendOutput, transformOutput } from '../cardanoOutputs';
import type { OutputWithData } from '../cardanoOutputs';
import { PROTO, ERRORS } from '../../../constants';
import {
    CardanoSignTransaction as CardanoSignTransactionSchema,
    CardanoSignTransactionExtended,
    type CardanoAuxiliaryDataSupplement,
    type CardanoSignedTxData,
    type CardanoSignedTxWitness,
} from '../../../types/api/cardano';
import { gatherWitnessPaths } from '../cardanoWitnesses';
import type { AssetGroupWithTokens } from '../cardanoTokenBundle';
import { tokenBundleToProto } from '../cardanoTokenBundle';
import { Assert, Type } from '@trezor/schema-utils';

// todo: remove when listed firmwares become mandatory for cardanoSignTransaction
const CardanoSignTransactionFeatures = Object.freeze({
    TransactionStreaming: ['0', '2.4.2'],
    TokenMinting: ['0', '2.4.3'],
    Multisig: ['0', '2.4.3'],
    NetworkIdInTxBody: ['0', '2.4.4'],
    OutputDatumHash: ['0', '2.4.4'],
    ScriptDataHash: ['0', '2.4.4'],
    Plutus: ['0', '2.4.4'],
    KeyHashStakeCredential: ['0', '2.4.4'],
    Babbage: ['0', '2.5.2'],
    CIP36Registration: ['0', '2.5.3'],
    CIP36RegistrationExternalPaymentAddress: ['0', '2.5.4'],
});

export type CardanoSignTransactionParams = {
    signingMode: PROTO.CardanoTxSigningMode;
    inputsWithPath: InputWithPath[];
    outputsWithData: OutputWithData[];
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
    collateralReturnWithData?: OutputWithData;
    totalCollateral?: PROTO.UintType;
    referenceInputs: PROTO.CardanoTxReferenceInput[];
    protocolMagic: number;
    networkId: number;
    witnessPaths: Path[];
    additionalWitnessRequests: Path[];
    derivationType: PROTO.CardanoDerivationType;
    includeNetworkId?: boolean;
    unsignedTx?: { body: string; hash: string };
    testnet?: boolean;
    chunkify?: boolean;
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

        // payload.auxiliaryData.catalystRegistrationParameters and
        // payload.auxiliaryData.governanceRegistrationParameters
        // are legacy params kept for backward compatibility (for now)
        // @ts-expect-error
        if (payload.auxiliaryData && payload.auxiliaryData.catalystRegistrationParameters) {
            console.warn(
                'Please use cVoteRegistrationParameters instead of catalystRegistrationParameters.',
            );
            payload.auxiliaryData.cVoteRegistrationParameters =
                // @ts-expect-error
                payload.auxiliaryData.catalystRegistrationParameters;
        }
        // @ts-expect-error
        if (payload.auxiliaryData && payload.auxiliaryData.governanceRegistrationParameters) {
            console.warn(
                'Please use cVoteRegistrationParameters instead of governanceRegistrationParameters.',
            );
            payload.auxiliaryData.cVoteRegistrationParameters =
                // @ts-expect-error
                payload.auxiliaryData.governanceRegistrationParameters;
        }

        // validate incoming parameters
        Assert(Type.Union([CardanoSignTransactionSchema, CardanoSignTransactionExtended]), payload);

        const inputsWithPath = payload.inputs.map(transformInput);

        const outputsWithData = payload.outputs.map(transformOutput);

        let certificatesWithPoolOwnersAndRelays: CertificateWithPoolOwnersAndRelays[] = [];
        if (payload.certificates) {
            certificatesWithPoolOwnersAndRelays = payload.certificates.map(transformCertificate);
        }

        let withdrawals: PROTO.CardanoTxWithdrawal[] = [];
        if (payload.withdrawals) {
            withdrawals = payload.withdrawals.map(withdrawal => ({
                path: withdrawal.path ? validatePath(withdrawal.path, 5) : undefined,
                amount: withdrawal.amount,
                script_hash: withdrawal.scriptHash,
                key_hash: withdrawal.keyHash,
            }));
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
            requiredSigners = payload.requiredSigners.map(
                requiredSigner =>
                    ({
                        key_path: requiredSigner.keyPath
                            ? validatePath(requiredSigner.keyPath, 3)
                            : undefined,
                        key_hash: requiredSigner.keyHash,
                    }) as PROTO.CardanoTxRequiredSigner,
            );
        }

        const collateralReturnWithData = payload.collateralReturn
            ? transformOutput(payload.collateralReturn)
            : undefined;

        let referenceInputs: PROTO.CardanoTxReferenceInput[] = [];
        if (payload.referenceInputs) {
            referenceInputs = payload.referenceInputs.map(transformReferenceInput);
        }

        this.params = {
            signingMode: payload.signingMode,
            inputsWithPath,
            outputsWithData,
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
            collateralReturnWithData,
            totalCollateral: payload.totalCollateral,
            referenceInputs,
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
            unsignedTx: 'unsignedTx' in payload ? payload.unsignedTx : undefined,
            testnet: 'testnet' in payload ? payload.testnet : undefined,
            chunkify: typeof payload.chunkify === 'boolean' ? payload.chunkify : false,
        };
    }

    get info() {
        return 'Sign Cardano transaction';
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

        // we no longer support non-streamed signing
        this._ensureFeatureIsSupported('TransactionStreaming');

        params.certificatesWithPoolOwnersAndRelays.forEach(({ certificate }) => {
            if (certificate.key_hash) {
                this._ensureFeatureIsSupported('KeyHashStakeCredential');
            }
        });

        params.outputsWithData.forEach(({ output }) => {
            if (output.datum_hash) {
                this._ensureFeatureIsSupported('OutputDatumHash');
            }
        });

        params.withdrawals.forEach(withdrawal => {
            if (withdrawal.key_hash) {
                this._ensureFeatureIsSupported('KeyHashStakeCredential');
            }
        });

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

        params.outputsWithData.forEach(({ output, inlineDatum, referenceScript }) => {
            if (
                output.format === PROTO.CardanoTxOutputSerializationFormat.MAP_BABBAGE ||
                inlineDatum ||
                referenceScript
            ) {
                this._ensureFeatureIsSupported('Babbage');
            }
        });

        if (
            params.collateralReturnWithData ||
            params.totalCollateral != null ||
            params.referenceInputs.length > 0
        ) {
            this._ensureFeatureIsSupported('Babbage');
        }

        if (
            params.requiredSigners.length > 0 &&
            params.signingMode !== PROTO.CardanoTxSigningMode.PLUTUS_TRANSACTION
        ) {
            // Trezor Firmware allowed requiredSigners in non-Plutus txs with the Babbage update
            this._ensureFeatureIsSupported('Babbage');
        }

        if (params.auxiliaryData?.cvote_registration_parameters) {
            const { format, delegations, voting_purpose, payment_address } =
                params.auxiliaryData.cvote_registration_parameters;
            if (
                format === PROTO.CardanoCVoteRegistrationFormat.CIP36 ||
                delegations?.length ||
                voting_purpose != null
            ) {
                this._ensureFeatureIsSupported('CIP36Registration');
            }

            if (payment_address) {
                this._ensureFeatureIsSupported('CIP36RegistrationExternalPaymentAddress');
            }
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
            outputs_count: this.params.outputsWithData.length,
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
            has_collateral_return: this.params.collateralReturnWithData != null,
            total_collateral: this.params.totalCollateral,
            reference_inputs_count: this.params.referenceInputs.length,
            derivation_type: this.params.derivationType,
            include_network_id: this.params.includeNetworkId,
            chunkify: this.params.chunkify,
        };

        // init
        await typedCall('CardanoSignTxInit', 'CardanoTxItemAck', signTxInitMessage);
        // inputs
        for (const { input } of this.params.inputsWithPath) {
            await typedCall('CardanoTxInput', 'CardanoTxItemAck', input);
        }
        // outputs and tokens
        for (const outputWithData of this.params.outputsWithData) {
            await sendOutput(typedCall, outputWithData);
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
            const { cvote_registration_parameters } = this.params.auxiliaryData;
            if (cvote_registration_parameters) {
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
                    cVoteRegistrationSignature: message.cvote_registration_signature,
                    // auxiliaryDataSupplement.catalystSignature and
                    // auxiliaryDataSupplement.governanceSignature
                    // kept for backward compatibility
                    // @ts-expect-error
                    catalystSignature: message.cvote_registration_signature,
                    governanceSignature: message.cvote_registration_signature,
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
        // collateral return
        if (this.params.collateralReturnWithData) {
            await sendOutput(typedCall, this.params.collateralReturnWithData);
        }
        // reference inputs
        for (const referenceInput of this.params.referenceInputs) {
            await typedCall('CardanoTxReferenceInput', 'CardanoTxItemAck', referenceInput);
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

    async run() {
        this._ensureFirmwareSupportsParams();

        const result = await this._sign_tx();

        if (!this.params.unsignedTx) return result;

        const { unsignedTx, testnet } = this.params;
        const { hash, witnesses } = result;

        // TODO this check not in staking?
        if (hash !== unsignedTx.hash) {
            throw ERRORS.TypedError(
                'Runtime',
                "Constructed transaction doesn't match the hash returned by the device.",
            );
        }

        const serializedTx = trezorUtils.signTransaction(unsignedTx.body, witnesses, { testnet });

        return {
            ...result,
            serializedTx,
        };
    }
}
