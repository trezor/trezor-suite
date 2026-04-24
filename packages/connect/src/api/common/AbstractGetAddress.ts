import { UI_REQUEST, createUiMessage } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodContext, MethodPermission, MethodReturnType } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';
import { getSerializedPath } from '../../utils/pathUtils';

export type AllGetAddressMethodName =
    | 'getAddress'
    | 'ethereumGetAddress'
    | 'cardanoGetAddress'
    | 'rippleGetAddress'
    | 'stellarGetAddress'
    | 'tezosGetAddress'
    | 'solanaGetAddress'
    | 'tronGetAddress';

type CallResult = { address: string; mac?: string };

export abstract class AbstractGetAddress<
    Name extends AllGetAddressMethodName,
    Param,
    RunResponse,
> extends AbstractMethod<Name, Param[]> {
    hasBundle?: boolean;
    progress = 0;

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    protected abstract getAddressN(param: Param): number[];
    protected abstract getShowDisplay(param: Param): boolean;
    protected abstract paramForSilent(param: Param): Param;
    protected abstract getPreviousAddress(param: Param): string | undefined;
    protected abstract setPreviousAddress(param: Param, address: string): void;

    protected abstract _call(param: Param): Promise<CallResult>;

    protected abstract buildRunResponse(param: Param, response: CallResult): RunResponse;

    protected addressesEqual(requested: string, actual: string): boolean {
        return requested === actual;
    }

    protected preProcessBatch(_param: Param): void {}

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            const param = this.params[this.progress];

            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(this.getAddressN(param)),
                address: this.getPreviousAddress(param) || 'not-set',
            };
        }
    }

    async run({ sendCoreMessage }: MethodContext): Promise<MethodReturnType<Name>> {
        const responses: RunResponse[] = [];

        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
            this.preProcessBatch(batch);

            if (this.getShowDisplay(batch)) {
                const silent = await this._call(this.paramForSilent(batch));
                const prev = this.getPreviousAddress(batch);
                if (typeof prev === 'string') {
                    if (!this.addressesEqual(prev, silent.address)) {
                        throw ERRORS.TypedError('Method_AddressNotMatch');
                    }
                } else {
                    this.setPreviousAddress(batch, silent.address);
                }
            }

            const rawResponse = await this._call(batch);
            const response = this.buildRunResponse(batch, rawResponse);
            responses.push(response);

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
