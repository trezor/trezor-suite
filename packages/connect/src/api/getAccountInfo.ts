// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import { UI_REQUEST, UI_RESPONSE, createUiMessage } from '@trezor/connect-common';
import type {
    AccountInfo,
    AccountUtxo,
    CoinInfo,
    DerivationPath,
    DiscoveryAccount,
    GetAccountInfo as GetAccountInfoParams,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { resolveAfter } from '@trezor/utils/src/resolveAfter';

import { type Blockchain, initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import { Discovery } from './common/Discovery';
import { bundlify, validateParams } from './common/paramsValidator';
import { requestExistingAccounts } from './common/requestExistingAccounts';
import { getAccountLabel, isUtxoBased } from '../utils/accountUtils';
import { getSerializedPath, validatePath } from '../utils/pathUtils';

type Request = GetAccountInfoParams & { address_n: number[]; coinInfo: CoinInfo };

export default class GetAccountInfo extends AbstractMethod<'getAccountInfo', Request[]> {
    disposed = false;
    hasBundle?: boolean;
    discovery?: Discovery;

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

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Export account info';
    }

    get confirmation() {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstParam: (typeof this.params)[number] = this.params[0];
        if (this.params.length === 1 && !firstParam.path && !firstParam.descriptor) {
            return {
                view: 'export-account-info' as const,
                label: `Export info for ${firstParam.coinInfo.label} account of your selection`,
                customConfirmButton: {
                    label: 'Proceed to account selection',
                    className: 'not-empty-css',
                },
            };
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
                    // if (i === 0) str += this.params.length > 1 ? ': ' : ' ';
                    // if (i > 0) str += ', ';
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
    }

    async run(context: MethodContext) {
        // address_n and descriptor are not set. use discovery
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstRequest: (typeof this.params)[number] = this.params[0];
        if (this.params.length === 1 && !firstRequest.path && !firstRequest.descriptor) {
            return this.discover(firstRequest, context);
        }

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
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const request: (typeof this.params)[number] = this.params[i];
            const { address_n } = request;
            let { descriptor } = request;
            let legacyXpub: string | undefined;
            let descriptorChecksum: string | undefined;

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

    private async discover(request: Request, context: MethodContext) {
        const { coinInfo, identity } = request;
        const blockchain = await initBlockchain(coinInfo, context.sendCoreMessage, identity);

        // Try to get existing accounts from the host (e.g. Suite) to skip device discovery
        const existingAccounts = await requestExistingAccounts({
            postMessage: context.sendCoreMessage,
            createUiPromise: context.createUiPromise,
            device: this.getDevice(),
            coinInfo,
        });

        if (existingAccounts) {
            return this.selectExistingAccount(existingAccounts, request, blockchain, context);
        }

        return this.runDiscovery(request, blockchain, context);
    }

    private async selectExistingAccount(
        accounts: DiscoveryAccount[],
        request: Request,
        blockchain: Blockchain,
        context: MethodContext,
    ) {
        const { coinInfo, defaultAccountType } = request;
        const dfd = context.createUiPromise(UI_RESPONSE.RECEIVE_ACCOUNT, this.getDevice());

        context.sendCoreMessage(
            createUiMessage(UI_REQUEST.SELECT_ACCOUNT, {
                type: 'complete',
                accountTypes: [...new Set(accounts.map(a => a.type))],
                defaultAccountType,
                coinInfo,
                accounts,
            }),
        );

        const uiResp = await dfd.promise;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const account: (typeof accounts)[number] = accounts[uiResp.payload];

        return this.fetchAccountInfo(account, request, blockchain);
    }

    private async runDiscovery(request: Request, blockchain: Blockchain, context: MethodContext) {
        const { coinInfo, defaultAccountType, derivationType } = request;
        const dfd = context.createUiPromise(UI_RESPONSE.RECEIVE_ACCOUNT, this.getDevice());

        const discovery = new Discovery({
            blockchain,
            getDescriptor: path =>
                this.getDevice().getCommands().getAccountDescriptor(coinInfo, path, derivationType),
        });

        discovery.on('progress', accounts => {
            context.sendCoreMessage(
                createUiMessage(
                    UI_REQUEST.SELECT_ACCOUNT,
                    {
                        type: 'progress',
                        coinInfo,
                        accounts,
                    },
                    dfd.requestId,
                ),
            );
        });
        discovery.on('complete', () => {
            context.sendCoreMessage(
                createUiMessage(
                    UI_REQUEST.SELECT_ACCOUNT,
                    {
                        type: 'end',
                        coinInfo,
                    },
                    dfd.requestId,
                ),
            );
        });
        // catch error from discovery process
        discovery.start().catch(error => {
            dfd.reject(error);
        });

        // set select account view
        // this view will be updated from discovery events
        context.sendCoreMessage(
            createUiMessage(
                UI_REQUEST.SELECT_ACCOUNT,
                {
                    type: 'start',
                    accountTypes: discovery.types.map(t => t.type),
                    defaultAccountType,
                    coinInfo,
                },
                dfd.requestId,
            ),
        );

        // wait for user action
        const uiResp = await dfd.promise;
        discovery.stop();

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const account: (typeof discovery.accounts)[number] = discovery.accounts[uiResp.payload];

        if (!discovery.completed) {
            await resolveAfter(501); // temporary solution, TODO: immediately resolve will cause "device call in progress"
        }

        return this.fetchAccountInfo(account, request, blockchain);
    }

    private async fetchAccountInfo(
        account: DiscoveryAccount,
        request: Request,
        blockchain: Blockchain,
    ) {
        const { coinInfo } = request;

        // get account info from backend
        const info = await blockchain.getAccountInfo({
            descriptor: account.descriptor,
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
