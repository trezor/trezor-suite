import {
    Bundle,
    GetOwnershipProof as GetOwnershipProofSchema,
    type MethodPermission,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { bundlify } from './common/paramsValidator';
import type { MethodContext, MethodMessage, MethodReturnType } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork } from '../data/coinInfo';
import { getScriptType, getSerializedPath, validatePath } from '../utils/pathUtils';

export default class GetOwnershipProof extends AbstractMethod<
    'getOwnershipProof',
    PROTO.GetOwnershipProof[]
> {
    constructor(message: MethodMessage<'getOwnershipProof'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(GetOwnershipProofSchema), payload);

        const preprocessed = payload.bundle.map(batch => {
            const address_n = validatePath(batch.path, 1);

            return { batch, address_n, coinInfo: getBitcoinNetwork(batch.coin || address_n) };
        });

        const params = preprocessed.map(({ batch, address_n, coinInfo }) => {
            const script_type = batch.scriptType || getScriptType(address_n);

            return {
                address_n,
                coin_name: coinInfo ? coinInfo.name : undefined,
                multisig: batch.multisig,
                script_type,
                user_confirmation: batch.userConfirmation,
                ownership_ids: batch.ownershipIds,
                commitment_data: batch.commitmentData,
            };
        });

        super(message, params);

        this.requiredFirmwareCoins = preprocessed.map(({ coinInfo }) => coinInfo);
        this.preauthorized = payload.bundle.some(batch => batch.preauthorized);
        this.hasBundle = hasBundle;
    }

    hasBundle?: boolean;

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Export ownership proof';
    }

    get confirmation() {
        return {
            view: 'export-address' as const,
            label: this.params.length > 1 ? 'Export multiple ownership proofs' : this.info,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
            if (this.preauthorized) {
                await cmd.preauthorize(true);
            }
            const { message } = await cmd.typedCall('GetOwnershipProof', 'OwnershipProof', batch);
            responses.push({
                ...message,
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
            });

            if (this.hasBundle) {
                // send progress
                sendCoreMessage(
                    createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
                        total: this.params.length,
                        progress: i,
                        response: message,
                    }),
                );
            }
        }

        return this.hasBundle ? responses : responses[0];
    }
}
