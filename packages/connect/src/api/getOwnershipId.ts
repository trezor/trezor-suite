import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodReturnType } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { validatePath, getScriptType, getSerializedPath } from '../utils/pathUtils';
import { getBitcoinNetwork } from '../data/coinInfo';
import { PROTO } from '../constants';
import { UI, createUiMessage } from '../events';
import { Bundle } from '../exports';
import { GetOwnershipId as GetOwnershipIdSchema } from '../types/api/getOwnershipId';

export default class GetOwnershipId extends AbstractMethod<
    'getOwnershipId',
    PROTO.GetOwnershipId[]
> {
    hasBundle?: boolean;

    init() {
        this.requiredPermissions = ['read'];

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

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.device.getCommands();
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
                this.postMessage(
                    createUiMessage(UI.BUNDLE_PROGRESS, {
                        progress: i,
                        response: message,
                    }),
                );
            }
        }

        return this.hasBundle ? responses : responses[0];
    }
}
