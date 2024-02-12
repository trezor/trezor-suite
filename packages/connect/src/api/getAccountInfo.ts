// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import { AbstractMethod, MethodReturnType, DEFAULT_FIRMWARE_RANGE } from '../core/AbstractMethod';
import { Discovery } from './common/Discovery';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { validatePath, getSerializedPath } from '../utils/pathUtils';
import { getAccountLabel, isUtxoBased } from '../utils/accountUtils';
import { resolveAfter } from '../utils/promiseUtils';
import { getCoinInfo } from '../data/coinInfo';
import { PROTO, ERRORS } from '../constants';
import { UI, createUiMessage } from '../events';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import type { CoinInfo, AccountInfo, AccountUtxo, DerivationPath } from '../types';
import type { GetAccountInfo as GetAccountInfoParams } from '../types/api/getAccountInfo';

type Request = GetAccountInfoParams & { address_n: number[]; coinInfo: CoinInfo };

export default class GetAccountInfo extends AbstractMethod<'getAccountInfo', Request[]> {
    disposed = false;
    hasBundle?: boolean;
    discovery?: Discovery;

    init() {
        this.requiredPermissions = ['read'];
        this.useDevice = true;
        this.useUi = true;

        // assume that device will not be used
        let willUseDevice = false;

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        validateParams(payload, [{ name: 'bundle', type: 'array' }]);

        this.params = payload.bundle.map(batch => {
            // validate incoming parameters
            validateParams(batch, [
                { name: 'coin', type: 'string', required: true },
                { name: 'descriptor', type: 'string' },
                { name: 'path', type: 'string' },

                { name: 'details', type: 'string' },
                { name: 'tokens', type: 'string' },
                { name: 'page', type: 'number' },
                { name: 'pageSize', type: 'number' },
                { name: 'from', type: 'number' },
                { name: 'to', type: 'number' },
                { name: 'contractFilter', type: 'string' },
                { name: 'gap', type: 'number' },
                { name: 'marker', type: 'object' },
                { name: 'defaultAccountType', type: 'string' },
                { name: 'derivationType', type: 'number' },
                { name: 'suppressBackupWarning', type: 'boolean' },
            ]);

            // validate coin info
            const coinInfo = getCoinInfo(batch.coin);
            if (!coinInfo) {
                throw ERRORS.TypedError('Method_UnknownCoin');
            }
            // validate backend
            isBackendSupported(coinInfo);
            // validate path if exists
            let address_n: number[] = [];
            if (batch.path) {
                address_n = validatePath(batch.path, 3);
                // since there is no descriptor device will be used
                willUseDevice = typeof batch.descriptor !== 'string';
            }
            if (!batch.path && !batch.descriptor) {
                if (payload.bundle.length > 1) {
                    throw Error('Discovery for multiple coins in not supported');
                }
                // device will be used in Discovery
                willUseDevice = true;
            }

            // set firmware range
            this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);

            return {
                ...batch,
                address_n,
                coinInfo,
            };
        });

        this.useDevice = willUseDevice;
        this.useUi = willUseDevice;
    }

    get info() {
        return 'Export account info';
    }

    async confirmation() {
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        if (this.params.length === 1 && !this.params[0].path && !this.params[0].descriptor) {
            // request confirmation view
            this.postMessage(
                createUiMessage(UI.REQUEST_CONFIRMATION, {
                    view: 'export-account-info',
                    label: `Export info for ${this.params[0].coinInfo.label} account of your selection`,
                    customConfirmButton: {
                        label: 'Proceed to account selection',
                        className: 'not-empty-css',
                    },
                }),
            );
        } else {
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
                keys[b.coinInfo.label].values.push(b.descriptor || b.address_n);
            });

            // prepare html for popup
            const str: string[] = [];
            Object.keys(keys).forEach((k, _i, _a) => {
                const details = keys[k];
                details.values.forEach(acc => {
                    // if (i === 0) str += this.params.length > 1 ? ': ' : ' ';
                    // if (i > 0) str += ', ';
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
                    label: `Export info for: ${str.join('')}`,
                }),
            );
        }

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
    async checkFirmwareRange(isUsingPopup: boolean) {
        // for popup mode use it like it was before
        if (isUsingPopup || this.params.length === 1) {
            return super.checkFirmwareRange(isUsingPopup);
        }
        // for trusted mode check each batch and return error with invalid bundle indexes
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
    }

    async run() {
        // address_n and descriptor are not set. use discovery
        if (this.params.length === 1 && !this.params[0].path && !this.params[0].descriptor) {
            return this.discover(this.params[0]);
        }

        const responses: MethodReturnType<typeof this.name> = [];

        const sendProgress = (progress: number, response: AccountInfo | null, error?: string) => {
            if (!this.hasBundle || (this.device && this.device.getCommands().disposed)) return;
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
            const { address_n } = request;
            let { descriptor } = request;
            let legacyXpub: string | undefined;

            if (this.disposed) break;

            // get descriptor from device
            if (address_n && typeof descriptor !== 'string') {
                try {
                    const accountDescriptor = await this.device
                        .getCommands()
                        .getAccountDescriptor(
                            request.coinInfo,
                            address_n,
                            typeof request.derivationType !== 'undefined'
                                ? request.derivationType
                                : PROTO.CardanoDerivationType.ICARUS_TREZOR,
                        );
                    if (accountDescriptor) {
                        descriptor = accountDescriptor.descriptor;
                        legacyXpub = accountDescriptor.legacyXpub;
                    }
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

            if (this.disposed) break;

            try {
                if (typeof descriptor !== 'string') {
                    throw ERRORS.TypedError('Runtime', 'GetAccountInfo: descriptor not found');
                }

                // initialize backend
                const blockchain = await initBlockchain(request.coinInfo, this.postMessage);

                if (this.disposed) break;

                // get account info from backend
                const info = await blockchain.getAccountInfo({
                    descriptor,
                    details: request.details,
                    tokens: request.tokens,
                    page: request.page,
                    pageSize: request.pageSize,
                    from: request.from,
                    to: request.to,
                    contractFilter: request.contractFilter,
                    gap: request.gap,
                    marker: request.marker,
                });

                if (this.disposed) break;

                let utxo: AccountUtxo[] | undefined;
                if (
                    isUtxoBased(request.coinInfo) &&
                    typeof request.details === 'string' &&
                    request.details !== 'basic'
                ) {
                    utxo = await blockchain.getAccountUtxo(descriptor);
                }

                if (this.disposed) break;

                // add account to responses
                const account: AccountInfo = {
                    path: request.path,
                    ...info,
                    descriptor, // override descriptor (otherwise eth checksum is lost)
                    legacyXpub,
                    utxo,
                };
                responses.push(account);

                sendProgress(i, account);
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

    async discover(request: Request) {
        const { coinInfo, defaultAccountType } = request;
        const blockchain = await initBlockchain(coinInfo, this.postMessage);
        const dfd = this.createUiPromise(UI.RECEIVE_ACCOUNT);

        const discovery = new Discovery({
            blockchain,
            commands: this.device.getCommands(),
            derivationType:
                typeof request.derivationType !== 'undefined'
                    ? request.derivationType
                    : PROTO.CardanoDerivationType.ICARUS_TREZOR,
        });
        discovery.on('progress', accounts => {
            this.postMessage(
                createUiMessage(UI.SELECT_ACCOUNT, {
                    type: 'progress',
                    coinInfo,
                    accounts,
                }),
            );
        });
        discovery.on('complete', () => {
            this.postMessage(
                createUiMessage(UI.SELECT_ACCOUNT, {
                    type: 'end',
                    coinInfo,
                }),
            );
        });
        // catch error from discovery process
        discovery.start().catch(error => {
            dfd.reject(error);
        });

        // set select account view
        // this view will be updated from discovery events
        this.postMessage(
            createUiMessage(UI.SELECT_ACCOUNT, {
                type: 'start',
                accountTypes: discovery.types.map(t => t.type),
                defaultAccountType,
                coinInfo,
            }),
        );

        // wait for user action
        const uiResp = await dfd.promise;
        discovery.stop();

        const account = discovery.accounts[uiResp.payload];

        if (!discovery.completed) {
            await resolveAfter(501).promise; // temporary solution, TODO: immediately resolve will cause "device call in progress"
        }

        // get account info from backend
        const info = await blockchain.getAccountInfo({
            descriptor: account.descriptor,
            details: request.details,
            tokens: request.tokens,
            page: request.page,
            pageSize: request.pageSize,
            from: request.from,
            to: request.to,
            contractFilter: request.contractFilter,
            gap: request.gap,
            marker: request.marker,
        });

        let utxo: AccountUtxo[] | undefined;
        if (
            isUtxoBased(coinInfo) &&
            typeof request.details === 'string' &&
            request.details !== 'basic'
        ) {
            utxo = await blockchain.getAccountUtxo(account.descriptor);
        }

        return {
            path: getSerializedPath(account.address_n),
            ...info,
            utxo,
        };
    }

    dispose() {
        this.disposed = true;
        const { discovery } = this;
        if (discovery) {
            discovery.removeAllListeners();
            discovery.stop();
        }
    }
}
