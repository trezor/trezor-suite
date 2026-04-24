import { Bundle, GetAddress as GetAddressSchema } from '@trezor/connect-common';
import { Assert } from '@trezor/schema-utils';

import { AbstractGetAddress } from './AbstractGetAddress';
import { bundlify } from './paramsValidator';
import type { MethodMessage } from '../../core/AbstractMethod';
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

type MiscRunResponse = {
    path: number[];
    serializedPath: string;
    address: string;
    mac?: string;
};

export abstract class AbstractMiscGetAddress<
    Name extends MiscGetAddressMethodName,
> extends AbstractGetAddress<Name, MiscGetAddressParams, MiscRunResponse> {
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

    protected getAddressN(param: MiscGetAddressParams) {
        return param.proto.address_n;
    }

    protected getShowDisplay(param: MiscGetAddressParams) {
        return param.proto.show_display;
    }

    protected paramForSilent(param: MiscGetAddressParams) {
        return { ...param, proto: { ...param.proto, show_display: false } };
    }

    protected getPreviousAddress(param: MiscGetAddressParams) {
        return param.address;
    }

    protected setPreviousAddress(param: MiscGetAddressParams, address: string) {
        param.address = address;
    }

    protected buildRunResponse(
        param: MiscGetAddressParams,
        response: { address: string; mac?: string },
    ): MiscRunResponse {
        return {
            path: param.proto.address_n,
            serializedPath: getSerializedPath(param.proto.address_n),
            address: response.address,
            mac: response.mac,
        };
    }
}
