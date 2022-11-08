import { AbstractMethod, MethodReturnType } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { validatePath, getScriptType, getSerializedPath } from '../utils/pathUtils';
import { getBitcoinNetwork } from '../data/coinInfo';
import { PROTO } from '../constants';
import { UI, createUiMessage } from '../events';

export default class GetOwnershipProof extends AbstractMethod<
    'getOwnershipProof',
    PROTO.GetOwnershipProof[]
> {
    hasBundle?: boolean;
    confirmed?: boolean;

    init() {
        this.requiredPermissions = ['read'];
        this.info = 'Export ownership proof';

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        validateParams(payload, [{ name: 'bundle', type: 'array' }]);

        this.params = payload.bundle.map(batch => {
            // validate incoming parameters for each batch
            validateParams(batch, [
                { name: 'path', required: true },
                { name: 'coin', type: 'string' },
                { name: 'multisig', type: 'object' },
                { name: 'scriptType', type: 'string' },
                { name: 'userConfirmation', type: 'boolean' },
                { name: 'ownershipIds', type: 'array' },
                { name: 'commitmentData', type: 'string' },
                { name: 'preauthorized', type: 'boolean' },
            ]);

            const address_n = validatePath(batch.path, 1);
            const coinInfo = getBitcoinNetwork(batch.coin || address_n);
            const script_type = batch.scriptType || getScriptType(address_n);
            this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);
            if (batch.preauthorized) {
                this.preauthorized = batch.preauthorized;
            }

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
    }

    async confirmation() {
        if (this.confirmed) return true;
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device);
        let label = this.info;
        if (this.params.length > 1) {
            label = 'Export multiple ownership proofs';
        }

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-address',
                label,
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        this.confirmed = uiResp.payload;
        return this.confirmed;
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.device.getCommands();
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
