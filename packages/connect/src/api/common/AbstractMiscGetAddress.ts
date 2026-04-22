import {
    Bundle,
    GetAddress as GetAddressSchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import { bundlify } from './paramsValidator';
import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';
import { fromHardened, getSerializedPath, validatePath } from '../../utils/pathUtils';

export type MiscGetAddressMethodName =
    | 'rippleGetAddress'
    | 'stellarGetAddress'
    | 'tezosGetAddress'
    | 'solanaGetAddress'
    | 'tronGetAddress';

type MiscProto = {
    address_n: number[];
    show_display: boolean;
    chunkify: boolean;
};

export type MiscGetAddressParams = {
    proto: MiscProto;
    address?: string;
};

export abstract class AbstractMiscGetAddress<
    Name extends MiscGetAddressMethodName,
> extends AbstractMethod<Name, MiscGetAddressParams[]> {
    hasBundle?: boolean;
    progress = 0;

    constructor(message: MethodMessage<Name>, pathDepth: number) {
        const { hasBundle, payload } = bundlify(message.payload);

        Assert(Bundle(GetAddressSchema), payload);

        const params: MiscGetAddressParams[] = payload.bundle.map(batch => ({
            proto: {
                address_n: validatePath(batch.path, pathDepth),
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            },
            address: batch.address,
        }));

        super(message, params);

        this.hasBundle = hasBundle;
        this.useUi = this.getUseUi(this.params, payload.useEventListener);
        this.confirmMissingBackup = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    protected getInfo(coinName: string, showAccountInInfo: boolean) {
        if (this.params.length > 1) {
            return `Export multiple ${coinName} addresses`;
        }
        if (showAccountInInfo) {
            return `Export ${coinName} address for account #${
                fromHardened(this.params[0].proto.address_n[2]) + 1
            }`;
        }

        return `Export ${coinName} address`;
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(this.params[this.progress].proto.address_n),
                address: this.params[this.progress].address || 'not-set',
            };
        }
    }

    protected getConfirmation(coinName: string) {
        if (this.params.length > 1) {
            return {
                view: 'export-address' as const,
                label: `Export multiple ${coinName} addresses`,
            };
        }

        return {
            view: 'export-address' as const,
            label: `Export ${coinName} address for account #${
                fromHardened(this.params[0].proto.address_n[2]) + 1
            }`,
        };
    }

    protected abstract _call(
        params: MiscGetAddressParams,
    ): Promise<{ address: string; mac?: string }>;

    async run({ sendCoreMessage }: MethodContext): Promise<MethodReturnType<Name>> {
        const responses: {
            path: number[];
            serializedPath: string;
            address: string;
            mac?: string;
        }[] = [];

        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
            if (batch.proto.show_display) {
                const silent = await this._call({
                    ...batch,
                    proto: { ...batch.proto, show_display: false },
                });
                if (typeof batch.address === 'string') {
                    if (batch.address !== silent.address) {
                        throw ERRORS.TypedError('Method_AddressNotMatch');
                    }
                } else {
                    batch.address = silent.address;
                }
            }

            const response = await this._call(batch);
            responses.push({
                path: batch.proto.address_n,
                serializedPath: getSerializedPath(batch.proto.address_n),
                address: response.address,
                mac: response.mac,
            });

            if (this.hasBundle) {
                sendCoreMessage(
                    createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
                        total: this.params.length,
                        progress: i,
                        response,
                    }),
                );
            }

            this.progress++;
        }

        return (this.hasBundle ? responses : responses[0]) as MethodReturnType<Name>;
    }
}
