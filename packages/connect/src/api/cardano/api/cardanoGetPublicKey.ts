// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoGetPublicKey.js

import {
    Bundle,
    CardanoGetPublicKey as CardanoGetPublicKeySchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { fromHardened, getSerializedPath, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
interface Params {
    proto: PROTO.CardanoGetPublicKey;
    suppressBackupWarning?: boolean;
}

export default class CardanoGetPublicKey extends AbstractMethod<'cardanoGetPublicKey', Params[]> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'cardanoGetPublicKey'>) {
        super(message);
        this.requiredDeviceCapabilities = ['Capability_Cardano'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Cardano'),
            this.firmwareRange,
        );
    }

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
        Assert(Bundle(CardanoGetPublicKeySchema), payload);

        this.params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 3);
            const proto = {
                address_n: path,
                derivation_type:
                    typeof batch.derivationType !== 'undefined'
                        ? batch.derivationType
                        : PROTO.CardanoDerivationType.ICARUS_TREZOR,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : false,
            };

            return { proto, suppressBackupWarning: batch.suppressBackupWarning };
        });

        this.confirmMissingBackup = !this.params.every(
            batch => batch.suppressBackupWarning || !batch.proto.show_display,
        );
    }

    get info() {
        return 'Export Cardano public key';
    }

    get confirmation() {
        return {
            view: 'export-xpub' as const,
            label:
                this.params.length > 1
                    ? 'Export multiple Cardano public keys'
                    : `Export Cardano public key for account #${
                          fromHardened(this.params[0].proto.address_n[2]) + 1
                      }`,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i].proto;
            const { message } = await cmd.typedCall(
                'CardanoGetPublicKey',
                'CardanoPublicKey',
                batch,
            );
            responses.push({
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
                publicKey: message.xpub,
                node: message.node,
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
