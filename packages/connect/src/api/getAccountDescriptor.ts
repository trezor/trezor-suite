import { AbstractMethod, MethodReturnType, DEFAULT_FIRMWARE_RANGE } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { validatePath, getSerializedPath } from '../utils/pathUtils';
import { getAccountLabel } from '../utils/accountUtils';
import { getCoinInfo } from '../data/coinInfo';
import { PROTO, ERRORS } from '../constants';
import { UI, createUiMessage } from '../events';
import { Bundle, type CoinInfo, type DerivationPath } from '../types';
import {
    GetAccountDescriptorParams,
    GetAccountDescriptorResponse,
} from '../types/api/getAccountDescriptor';
import { Assert } from '@trezor/schema-utils';

type Request = GetAccountDescriptorParams & { address_n: number[]; coinInfo: CoinInfo };

export default class GetAccountDescriptor extends AbstractMethod<
    'getAccountDescriptor',
    Request[]
> {
    disposed = false;
    hasBundle?: boolean;

    init() {
        this.requiredPermissions = ['read'];
        this.useDevice = true;
        this.useUi = true;

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(GetAccountDescriptorParams), payload);

        this.params = payload.bundle.map(batch => {
            // validate coin info
            const coinInfo = getCoinInfo(batch.coin);
            if (!coinInfo) {
                throw ERRORS.TypedError('Method_UnknownCoin');
            }
            // validate path
            const address_n = validatePath(batch.path, 3);

            // set firmware range
            this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);

            return {
                ...batch,
                address_n,
                coinInfo,
            };
        });
    }

    get info() {
        return 'Export account descriptor';
    }

    async confirmation() {
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

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
            keys[b.coinInfo.label].values.push(b.address_n);
        });

        // prepare html for popup
        const str: string[] = [];
        Object.keys(keys).forEach((k, _i, _a) => {
            const details = keys[k];
            details.values.forEach(acc => {
                str.push('<span>');
                str.push(k);
                str.push(' ');
                if (typeof acc === 'string') {
                    str.push(acc);
                } else {
                    str.push(getAccountLabel(acc, details.coinInfo));
                }
                str.push('</span>');
            });
        });

        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-account-info',
                label: `Export descriptor for: ${str.join('')}`,
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        return uiResp.payload;
    }

    async noBackupConfirmation(allowSuppression?: boolean) {
        if (allowSuppression && this.params.every(batch => batch.suppressBackupWarning)) {
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

    // override AbstractMethod function
    // this is a special case where we want to check firmwareRange in bundle
    // and return error with bundle indexes
    async checkFirmwareRange(_isUsingPopup: boolean) {
        // check each batch and return error with invalid bundle indexes
        // find invalid ranges
        const invalid = [];
        for (let i = 0; i < this.params.length; i++) {
            // set FW range for current batch
            this.firmwareRange = getFirmwareRange(
                this.name,
                this.params[i].coinInfo,
                DEFAULT_FIRMWARE_RANGE,
            );
            const exception = await super.checkFirmwareRange(false);
            if (exception) {
                invalid.push({
                    index: i,
                    exception,
                    coin: this.params[i].coin,
                });
            }
        }
        // return invalid ranges in custom error
        if (invalid.length > 0) {
            throw ERRORS.TypedError('Method_Discovery_BundleException', JSON.stringify(invalid));
        }

        return undefined;
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];

        const sendProgress = (
            progress: number,
            response: GetAccountDescriptorResponse | null,
            error?: string,
        ) => {
            if (!this.hasBundle || this.disposed) return;
            // send progress to UI
            this.postMessage(
                createUiMessage(UI.BUNDLE_PROGRESS, {
                    progress,
                    response,
                    error,
                }),
            );
        };

        for (let i = 0; i < this.params.length; i++) {
            const request = this.params[i];

            if (this.disposed) break;

            try {
                const { descriptor, address_n, legacyXpub } = await this.device
                    .getCommands()
                    .getAccountDescriptor(
                        request.coinInfo,
                        request.address_n,
                        typeof request.derivationType !== 'undefined'
                            ? request.derivationType
                            : PROTO.CardanoDerivationType.ICARUS_TREZOR,
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
