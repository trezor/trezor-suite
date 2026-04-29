// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import { UI_REQUEST, createUiMessage } from '@trezor/connect-common';
import type {
    AccountInfo,
    AccountUtxo,
    CoinInfo,
    DerivationPath,
    GetAccountInfo as GetAccountInfoParams,
    PermissionRequest,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { fromHardenedPathPart } from '@trezor/crypto-utils';

import { assertBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import type { MethodContext, MethodMessage, MethodReturnType } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';
import { bundlify, validateParams } from './common/paramsValidator';
import { getAccountLabel, isUtxoBased } from '../utils/accountUtils';
import { buildOutputDescriptor } from '../utils/buildOutputDescriptor';
import { getScriptType, validatePath } from '../utils/pathUtils';

type Request = GetAccountInfoParams & { address_n: number[]; coinInfo: CoinInfo };

export default class GetAccountInfo extends AbstractMethod<'getAccountInfo', Request[]> {
    disposed = false;
    hasBundle?: boolean;

    constructor(message: MethodMessage<'getAccountInfo'>) {
        // assume that device will not be used
        let willUseDevice = false;

        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        validateParams(payload, [{ name: 'bundle', type: 'array' }]);

        const params = payload.bundle.map(batch => {
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
                { name: 'protocols', type: 'array' },
                { name: 'confirmedNonce', type: 'boolean' },
                { name: 'privatePending', type: 'object' },
                { name: 'defaultAccountType', type: 'string' },
                { name: 'derivationType', type: 'number' },
                { name: 'suppressBackupWarning', type: 'boolean' },
            ]);

            // validate coin info
            const coinInfo = getCoinInfoOrThrow(batch.coin);
            // validate backend
            assertBackendSupported(coinInfo);
            // validate path if exists
            let address_n: number[] = [];
            if (batch.path) {
                // Length 2 to allow root paths of single-account types.
                address_n = validatePath(batch.path, 2);
                // since there is no descriptor device will be used
                willUseDevice = typeof batch.descriptor !== 'string';
            }
            if (!batch.path && !batch.descriptor) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    'GetAccountInfo: path or descriptor is required',
                );
            }

            return {
                ...batch,
                address_n,
                coinInfo,
            };
        });

        super(message, params);

        this.hasBundle = hasBundle;
        this.useDevice = willUseDevice;
        this.useDeviceState = willUseDevice;
        this.useUi = willUseDevice;
        this.confirmMissingBackup = !params.every(batch => batch.suppressBackupWarning);
        this.requiredFirmwareCoins = params.map(({ coinInfo }) => coinInfo);
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('read_account_info', this.requiredFirmwareCoins);
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
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const entry: (typeof keys)[string] = keys[b.coinInfo.label];
            entry.values.push(b.descriptor || b.address_n);
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
            label: `Export info for: ${str.join('')}`,
        };
    }

    async run(context: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];

        const sendProgress = (progress: number, response: AccountInfo | null, error?: string) => {
            if (!this.hasBundle || this.getDevice()?.getCurrentSession().isDisposed()) return;
            // send progress to UI
            context.sendCoreMessage(
                createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
                    total: this.params.length,
                    progress,
                    response,
                    error,
                }),
            );
        };

        for (let i = 0; i < this.params.length; i++) {
            const allParams = this.params;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const request: (typeof allParams)[number] = allParams[i];
            const { address_n } = request;
            let { descriptor } = request;
            let legacyXpub: string | undefined;
            let descriptorChecksum: string | undefined;
            let rootFingerprint: number | undefined;
            let outputDescriptorBip380: string | undefined;

            if (this.disposed) break;

            // get descriptor from device
            if (address_n && typeof descriptor !== 'string') {
                try {
                    const accountDescriptor = await this.getDevice()
                        .getCommands()
                        .getAccountDescriptor(request.coinInfo, address_n, request.derivationType);
                    if (accountDescriptor) {
                        descriptor = accountDescriptor.descriptor;
                        legacyXpub = accountDescriptor.legacyXpub;
                        descriptorChecksum = accountDescriptor.descriptorChecksum;
                        rootFingerprint = accountDescriptor.rootFingerprint;
                        // @ts-expect-error: indexing with noUncheckedIndexedAccess
                        const accountIndex: number = address_n[2];
                        // @ts-expect-error: indexing with noUncheckedIndexedAccess
                        const purposeIndex: number = address_n[0];

                        // outputDescriptorBip380 is provided by firmware >= 2.6.5.
                        // For older firmware, build it from the available data (bitcoin only).
                        outputDescriptorBip380 =
                            accountDescriptor.outputDescriptorBip380 ??
                            (request.coinInfo.type === 'bitcoin' && legacyXpub
                                ? buildOutputDescriptor({
                                      coin: request.coinInfo.name,
                                      account: fromHardenedPathPart(accountIndex),
                                      purpose: fromHardenedPathPart(purposeIndex),
                                      scriptType: getScriptType(address_n),
                                      xpub: legacyXpub,
                                      rootFingerprint,
                                  })
                                : undefined);
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
                    context.sendCoreMessage,
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
                    protocols: request.protocols,
                    confirmedNonce: request.confirmedNonce,
                    privatePending: request.privatePending,
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

                // EVM descriptors may be names (.eth and other TLDs) which the backend resolved to hex
                const isNamedEvmDescriptor =
                    request.coinInfo.type === 'ethereum' && descriptor.includes('.');

                // add account to responses
                const account: AccountInfo = {
                    path: request.path,
                    ...info,
                    // override descriptor (otherwise eth checksum is lost)
                    descriptor: isNamedEvmDescriptor ? info.descriptor : descriptor,
                    legacyXpub,
                    utxo,
                    descriptorChecksum,
                    outputDescriptorBip380,
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
