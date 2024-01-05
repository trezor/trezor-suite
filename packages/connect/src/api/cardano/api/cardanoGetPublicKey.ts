// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoGetPublicKey.js

import { PROTO } from '../../../constants';
import { AbstractMethod, MethodReturnType } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath, fromHardened, getSerializedPath } from '../../../utils/pathUtils';
import { UI, createUiMessage } from '../../../events';
import { Assert } from '@trezor/schema-utils';
import { Bundle } from '../../../types';
import { CardanoGetPublicKey as CardanoGetPublicKeySchema } from '../../../types/api/cardano';

interface Params extends PROTO.CardanoGetPublicKey {
    suppressBackupWarning?: boolean;
}

export default class CardanoGetPublicKey extends AbstractMethod<'cardanoGetPublicKey', Params[]> {
    hasBundle?: boolean;
    confirmed?: boolean;

    init() {
        this.requiredPermissions = ['read'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Cardano'),
            this.firmwareRange,
        );

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(CardanoGetPublicKeySchema), payload);

        this.params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 3);
            return {
                address_n: path,
                derivation_type:
                    typeof batch.derivationType !== 'undefined'
                        ? batch.derivationType
                        : PROTO.CardanoDerivationType.ICARUS_TREZOR,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : false,
                suppress_backup_warning: batch.suppressBackupWarning,
            };
        });
    }

    get info() {
        return 'Export Cardano public key';
    }

    async confirmation() {
        if (this.confirmed) return true;
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        let label: string;
        if (this.params.length > 1) {
            label = 'Export multiple Cardano public keys';
        } else {
            label = `Export Cardano public key for account #${
                fromHardened(this.params[0].address_n[2]) + 1
            }`;
        }

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-xpub',
                label,
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        this.confirmed = uiResp.payload;
        return this.confirmed;
    }

    async noBackupConfirmation(allowSuppression?: boolean) {
        if (
            allowSuppression &&
            this.params.every(batch => batch.suppressBackupWarning || !batch.show_display)
        ) {
            return true;
        }
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'no-backup',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;
        return uiResp.payload;
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.device.getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
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
