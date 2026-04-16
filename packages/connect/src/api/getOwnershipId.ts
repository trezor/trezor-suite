import {
    Bundle,
    GetOwnershipId as GetOwnershipIdSchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { bundlify } from './common/paramsValidator';
import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork } from '../data/coinInfo';
import { getScriptType, getSerializedPath, validatePath } from '../utils/pathUtils';

export default class GetOwnershipId extends AbstractMethod<
    'getOwnershipId',
    PROTO.GetOwnershipId[]
> {
    constructor(message: MethodMessage<'getOwnershipId'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(GetOwnershipIdSchema), payload);

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
            };
        });

        super(message, params);

        this.requiredFirmwareCoins = preprocessed.map(({ coinInfo }) => coinInfo);
        this.hasBundle = hasBundle;
    }
    hasBundle?: boolean;

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Export ownership id';
    }

    get confirmation() {
        return {
            view: 'export-address' as const,
            label: this.params.length > 1 ? 'Export multiple ownership proof ids' : this.info,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const batch: (typeof this.params)[number] = this.params[i];
            const { message } = await cmd.typedCall('GetOwnershipId', 'OwnershipId', batch);
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

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof responses)[number] = responses[0];

        return this.hasBundle ? responses : first;
    }
}
