// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import { UI_REQUEST, createUiMessage } from '@trezor/connect-common';
import type {
    AccountInfo,
    AccountUtxo,
    CoinInfo,
    GetAccountInfo as GetAccountInfoParams,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import { assertBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import type { MethodContext, MethodMessage, MethodReturnType } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';
import { bundlify, validateParams } from './common/paramsValidator';
import { isUtxoBased } from '../utils/accountUtils';

type Request = GetAccountInfoParams & { coinInfo: CoinInfo };

export default class GetAccountInfo extends AbstractMethod<'getAccountInfo', Request[]> {
    disposed = false;
    hasBundle?: boolean;

    constructor(message: MethodMessage<'getAccountInfo'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        validateParams(payload, [{ name: 'bundle', type: 'array' }]);

        const params = payload.bundle.map(batch => {
            // validate incoming parameters
            validateParams(batch, [
                { name: 'coin', type: 'string', required: true },
                { name: 'identity', type: 'string' },
                { name: 'descriptor', type: 'string', required: true },

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
            ]);

            // validate coin info
            const coinInfo = getCoinInfoOrThrow(batch.coin);
            // validate backend
            assertBackendSupported(coinInfo);

            return { ...batch, coinInfo };
        });

        super(message, params);

        this.hasBundle = hasBundle;
        this.useDevice = false;
        this.useDeviceState = false;
        this.useUi = false;
    }

    get requiredPermissions() {
        return [];
    }

    async run(context: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];

        const sendProgress = (progress: number, response: AccountInfo | null, error?: string) => {
            if (!this.hasBundle) return;
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
            const { descriptor } = request;

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

                // add account to responses
                const account: AccountInfo = {
                    ...info,
                    descriptor, // override descriptor (otherwise eth checksum is lost)
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

    dispose() {
        this.disposed = true;
    }
}
