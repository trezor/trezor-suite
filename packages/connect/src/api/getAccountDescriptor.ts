import type {
    CoinInfo,
    DerivationPath,
    GetAccountDescriptorResponse,
} from '@trezor/connect-common';
import {
    Bundle,
    GetAccountDescriptorParams,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';

import { bundlify } from './common/paramsValidator';
import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import { getAccountLabel } from '../utils/accountUtils';
import { getSerializedPath, validatePath } from '../utils/pathUtils';

type Request = GetAccountDescriptorParams & { address_n: number[]; coinInfo: CoinInfo };

export default class GetAccountDescriptor extends AbstractMethod<
    'getAccountDescriptor',
    Request[]
> {
    disposed = false;
    hasBundle?: boolean;

    constructor(message: MethodMessage<'getAccountDescriptor'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(GetAccountDescriptorParams), payload);

        const params = payload.bundle.map(batch => {
            // validate coin info
            const coinInfo = getCoinInfo(batch.coin);
            if (!coinInfo) {
                throw ERRORS.TypedError('Method_UnknownCoin');
            }
            // validate path
            const address_n = validatePath(batch.path, 3);

            return {
                ...batch,
                address_n,
                coinInfo,
            };
        });

        super(message, params);

        this.requiredFirmwareCoins = params.map(({ coinInfo }) => coinInfo);
        this.hasBundle = hasBundle;
        this.confirmMissingBackup = !this.params.every(batch => batch.suppressBackupWarning);
        this.useDevice = true;
        this.useUi = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Export account descriptor';
    }

    get confirmation() {
        const keys: {
            [coin: string]: { coinInfo: CoinInfo; values: DerivationPath[] };
        } = {};
        this.params.forEach(b => {
            if (!keys[b.coinInfo.label]) {
                keys[b.coinInfo.label] = {
                    coinInfo: b.coinInfo,
                    values: [],
                };
            }
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const entry: (typeof keys)[string] = keys[b.coinInfo.label];
            entry.values.push(b.address_n);
        });

        // prepare html for popup
        const str: string[] = [];
        Object.keys(keys).forEach((k, _i, _a) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const details: (typeof keys)[string] = keys[k];
            details.values.forEach(acc => {
                str.push(k);
                str.push(' ');
                if (typeof acc === 'string') {
                    str.push(acc);
                } else {
                    str.push(getAccountLabel(acc, details.coinInfo));
                }
            });
        });

        return {
            view: 'export-account-info' as const,
            label: `Export descriptor for: ${str.join('')}`,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];

        const sendProgress = (
            progress: number,
            response: GetAccountDescriptorResponse | null,
            error?: string,
        ) => {
            if (!this.hasBundle || this.disposed) return;
            // send progress to UI
            sendCoreMessage(
                createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
                    total: this.params.length,
                    progress,
                    response,
                    error,
                }),
            );
        };

        for (let i = 0; i < this.params.length; i++) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const request: (typeof this.params)[number] = this.params[i];

            if (this.disposed) break;

            try {
                const { descriptor, address_n, legacyXpub } = await this.getDevice()
                    .getCommands()
                    .getAccountDescriptor(
                        request.coinInfo,
                        request.address_n,
                        request.derivationType,
                    );
                const response = {
                    descriptor,
                    path: getSerializedPath(address_n),
                    legacyXpub,
                };
                sendProgress(i, response);
                responses.push(response);
            } catch (error) {
                if (this.hasBundle) {
                    responses.push(null);
                    sendProgress(i, null, error.message);

                    continue;
                } else {
                    throw error;
                }
            }
        }

        if (this.disposed) return new Promise<typeof responses>(() => []);

        return this.hasBundle ? responses : responses[0]!;
    }

    dispose() {
        this.disposed = true;
    }
}
