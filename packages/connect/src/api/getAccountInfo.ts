// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import { ERRORS } from '@trezor/connect-common/src/constants';

import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import {
    AbstractMethod,
    DEFAULT_FIRMWARE_RANGE,
    MethodPermission,
    MethodReturnType,
    Payload,
} from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import { UI_REQUEST, createUiMessage } from '../events';
import type { AccountInfo, AccountUtxo, CoinInfo, DerivationPath } from '../types';
import { getFirmwareRange, validateParams } from './common/paramsValidator';
import type { GetAccountInfo as GetAccountInfoParams } from '../types/api/getAccountInfo';
import { getAccountLabel, isUtxoBased } from '../utils/accountUtils';
import { validatePath } from '../utils/pathUtils';

type Request = GetAccountInfoParams & { address_n: number[]; coinInfo: CoinInfo };

export default class GetAccountInfo extends AbstractMethod<'getAccountInfo', Request[]> {
    disposed = false;
    hasBundle?: boolean;

    constructor(message: { id?: number; payload: Payload<'getAccountInfo'> }) {
        super(message);
        this.useDevice = true;
        this.useUi = true;
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
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
                { name: 'identity', type: 'string' },
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
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    'Either path or descriptor must be provided',
                );
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
        this.useDeviceState = willUseDevice;
        this.useUi = willUseDevice;
        this.confirmMissingBackup = !this.params.every(batch => batch.suppressBackupWarning);
    }

    get info() {
        return 'Export account info';
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
            keys[b.coinInfo.label].values.push(b.descriptor || b.address_n);
        });

        // prepare html for popup
        const str: string[] = [];
        Object.keys(keys).forEach((k, _i, _a) => {
            const details = keys[k];
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
            label: `Export info for: ${str.join('')}`,
        };
    }

    // override AbstractMethod function
    // this is a special case where we want to check firmwareRange in bundle
    // and return error with bundle indexes
    checkFirmwareRange() {
        if (this.params.length === 1) {
            return super.checkFirmwareRange();
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
            const exception = super.checkFirmwareRange();
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
        const responses: MethodReturnType<typeof this.name> = [];

        const sendProgress = (progress: number, response: AccountInfo | null, error?: string) => {
            if (!this.hasBundle || this.device?.getCurrentSession().isDisposed()) return;
            // send progress to UI
            this.postMessage(
                createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
                    total: this.params.length,
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
            let descriptorChecksum: string | undefined;

            if (this.disposed) break;

            // get descriptor from device
            if (address_n && typeof descriptor !== 'string') {
                try {
                    const accountDescriptor = await this.device
                        .getCommands()
                        .getAccountDescriptor(request.coinInfo, address_n, request.derivationType);
                    if (accountDescriptor) {
                        descriptor = accountDescriptor.descriptor;
                        legacyXpub = accountDescriptor.legacyXpub;
                        descriptorChecksum = accountDescriptor.descriptorChecksum;
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
                const blockchain = await initBlockchain(
                    request.coinInfo,
                    this.postMessage,
                    request.identity,
                );

                if (this.disposed) break;

                // get account info from backend
                const info = await blockchain.getAccountInfo({
                    descriptor,
                    details: request.details,
                    tokens: request.tokens,
                    page: request.page,
                    pageSize: request.pageSize,
                    pageCursor: request.pageCursor,
                    from: request.from,
                    to: request.to,
                    contractFilter: request.contractFilter,
                    gap: request.gap,
                    marker: request.marker,
                    tokenAccountsPubKeys: request.tokenAccountsPubKeys,
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
                    descriptorChecksum,
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

    dispose() {
        this.disposed = true;
    }
}
