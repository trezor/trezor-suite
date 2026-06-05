import { UI_REQUEST } from '@trezor/connect-common';
import type { PermissionRequest } from '@trezor/connect-common';
import type { VerifyAuthenticityProofResult } from '@trezor/device-authenticity';
import {
    AuthenticateDeviceParams,
    deviceAuthenticityBlacklistConfig,
    deviceAuthenticityConfig,
    getRandomChallenge,
    prepareDeviceAuthenticityData,
    validateSerialNumbers,
    verifyAuthenticityProof,
} from '@trezor/device-authenticity';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

export default class AuthenticateDevice extends AbstractMethod<
    'authenticateDevice',
    AuthenticateDeviceParams
> {
    constructor(message: MethodMessage<'authenticateDevice'>) {
        const { payload } = message;

        Assert(AuthenticateDeviceParams, payload);

        const params = {
            config: payload.config,
            blacklistConfig: payload.blacklistConfig,
            allowDebugKeys: payload.allowDebugKeys,
        };

        super(message, params);
        this.useEmptyPassphrase = true;
        this.allowDeviceMode = [UI_REQUEST.INITIALIZE, UI_REQUEST.SEEDLESS];
        this.skipFinalReload = false;
        this.useDeviceState = false;
    }
    get requiredPermissions(): PermissionRequest[] {
        return [{ permission: 'management' }];
    }

    async streamAuthenticityProofs(challenge: Buffer) {
        const cmd = this.getDevice().getCommands();
        const MAX_CHUNK_SIZE = 500;

        this.getDevice().startPiggybackAck();

        // 1. Start streaming authenticity proofs
        // Device will respond with sizes of proofs and certificates, which will be used to fetch subsequent chunks.
        const { message: proofSizes } = await cmd.typedCall(
            'AuthenticateDevice',
            'AuthenticityProofSizes',
            {
                challenge: challenge.toString('hex'),
                stream: true,
            },
        );

        const proofTypes = [
            {
                name: 'optiga',
                type: PROTO.AuthenticityProofType.OPTIGA,
                certSizes: proofSizes.optiga_certificates,
                sigSize: proofSizes.optiga_signature,
            },
            {
                name: 'tropic',
                type: PROTO.AuthenticityProofType.TROPIC,
                certSizes: proofSizes.tropic_certificates,
                sigSize: proofSizes.tropic_signature,
            },
            {
                name: 'mcu',
                type: PROTO.AuthenticityProofType.MCU,
                certSizes: proofSizes.mcu_certificates,
                sigSize: proofSizes.mcu_signature,
            },
        ] as const;

        const authenticityProof: PROTO.AuthenticityProof = {
            optiga_certificates: [],
            optiga_signature: '',
            tropic_certificates: [],
            tropic_signature: undefined,
            mcu_certificates: [],
            mcu_signature: undefined,
        };

        const getChunk = async (
            params: { proof_type: number; index?: number },
            chunkSize: number,
        ) => {
            const chunks: string[] = [];
            let offset = 0;
            while (offset < chunkSize) {
                const size = Math.min(MAX_CHUNK_SIZE, chunkSize - offset);
                const { message } = await cmd.typedCall(
                    'GetAuthenticityProofChunk',
                    'AuthenticityProofChunk',
                    {
                        ...params,
                        offset,
                        size,
                    },
                );
                chunks.push(message.chunk);
                offset += size;
            }

            return chunks.join('');
        };

        // 2. Fetch all certificates and signatures based on sizes received in the first response.
        for (const { name, type, certSizes, sigSize } of proofTypes) {
            for (const [i, certSize] of certSizes.entries()) {
                const cert = await getChunk({ proof_type: type, index: i }, certSize);
                (authenticityProof[`${name}_certificates`] as string[]).push(cert);
            }

            if (sigSize) {
                (authenticityProof[`${name}_signature`] as string) = await getChunk(
                    { proof_type: type },
                    sigSize,
                );
            }
        }

        // 3. Stop streaming.
        await cmd.typedCall('GetAuthenticityProofChunk', 'Success', {
            offset: 0,
            size: 0,
        });

        await this.getDevice().stopPiggybackAck();

        return authenticityProof;
    }

    async getAuthenticityProofs(challenge: Buffer) {
        const { message } = await this.getDevice()
            .getCommands()
            .typedCall('AuthenticateDevice', 'AuthenticityProof', {
                challenge: challenge.toString('hex'),
            });

        return message;
    }

    async run() {
        const challenge = getRandomChallenge();
        const { unavailableCapabilities } = this.getDevice();

        // authenticityProofChunk and mcuDeviceAuthentication are strictly connected as MCU proofs are too large to be retrieved without chunking.
        // if streaming is unavailable device will not return MCU proofs.
        // see: https://github.com/trezor/trezor-firmware/pull/6961
        const authenticityProof = !unavailableCapabilities['authenticityProofChunk']
            ? await this.streamAuthenticityProofs(challenge)
            : await this.getAuthenticityProofs(challenge);

        const config = this.params.config || deviceAuthenticityConfig;
        const blacklistConfig = this.params.blacklistConfig || deviceAuthenticityBlacklistConfig;
        const commonParams = {
            signedData: prepareDeviceAuthenticityData({ payload: challenge }),
            deviceModel: this.getDevice().features.internal_model,
            allowDebugKeys: this.params.allowDebugKeys,
            config,
            blacklistConfig,
        };

        const getOptigaResult = async (): Promise<VerifyAuthenticityProofResult> => {
            const { optiga_signature: signature, optiga_certificates: certificates } =
                authenticityProof;
            const isAvailable = signature && certificates.length > 0;
            if (isAvailable) {
                return await verifyAuthenticityProof({ ...commonParams, certificates, signature });
            }

            // all devices capable of 'authenticateDevice' (see src/data/config.ts) have Optiga, so it's always required
            return { valid: false, error: 'RESPONSE_PAYLOAD_MISSING' };
        };

        const hasTropicAbility = !unavailableCapabilities['tropicDeviceAuthentication'];
        const getTropicResult = async (): Promise<VerifyAuthenticityProofResult | null> => {
            const { tropic_signature: signature, tropic_certificates: certificates } =
                authenticityProof;
            const isAvailable = signature && certificates.length > 0;
            const isRequired = hasTropicAbility;
            if (isAvailable) {
                return await verifyAuthenticityProof({ ...commonParams, certificates, signature });
            }

            return isRequired ? { valid: false, error: 'RESPONSE_PAYLOAD_MISSING' } : null;
        };

        const getMCUResult = async (): Promise<VerifyAuthenticityProofResult | null> => {
            const { mcu_signature: signature, mcu_certificates: certificates } = authenticityProof;
            const isAvailable = signature && certificates.length > 0;
            const isRequired = !unavailableCapabilities['mcuDeviceAuthentication'];
            if (isAvailable) {
                return await verifyAuthenticityProof({
                    ...commonParams,
                    certificates,
                    signature,
                });
            }

            return isRequired ? { valid: false, error: 'RESPONSE_PAYLOAD_MISSING' } : null;
        };

        const [optigaResult, tropicResult, mcuResult] = await Promise.all([
            getOptigaResult(),
            getTropicResult(),
            getMCUResult(),
        ]);

        const results = { optigaResult, tropicResult, mcuResult };

        // Only T3W1 and later have serialNumber (i.e. devices that support Tropic authentication), this validation is skipped for all older models.
        return hasTropicAbility ? validateSerialNumbers(results) : results;
    }
}
