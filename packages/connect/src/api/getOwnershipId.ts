import {
    Bundle,
    GetOwnershipId as GetOwnershipIdSchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { getFirmwareRange } from './common/paramsValidator';
import type { MethodContext, MethodPermission, MethodReturnType } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getBitcoinNetwork } from '../data/coinInfo';
import { getScriptType, getSerializedPath, validatePath } from '../utils/pathUtils';

export default class GetOwnershipId extends AbstractMethod<
    'getOwnershipId',
    PROTO.GetOwnershipId[]
> {
    hasBundle?: boolean;

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(GetOwnershipIdSchema), payload);

        this.params = payload.bundle.map(batch => {
            const address_n = validatePath(batch.path, 1);
            const coinInfo = getBitcoinNetwork(batch.coin || address_n);
            const script_type = batch.scriptType || getScriptType(address_n);
            this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);

            return {
                address_n,
                coin_name: coinInfo ? coinInfo.name : undefined,
                multisig: batch.multisig,
                script_type,
            };
        });
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
            const batch = this.params[i];
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

        return this.hasBundle ? responses : responses[0];
    }
}
