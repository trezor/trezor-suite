// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import { getSynchronize } from '@trezor/utils';

import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import { ERRORS } from '../constants';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import { UI, createUiMessage } from '../events';
import type { CoinInfo } from '../types';
import { validateParams } from './common/paramsValidator';
import {
    ACCOUNT_TYPES,
    AccountTypeItem,
    AccountTypeKey,
    AdditionalParams,
    DiscoverAccountsProgress,
} from '../types/api/discoverAccounts';
import { isUtxoBased } from '../utils/accountUtils';
import { validatePath } from '../utils/pathUtils';

const ACCOUNT_LIMIT = 10;
const TXS_PER_PAGE = 25;
const DETAILS = 'txs';

type Request = AdditionalParams & {
    account: AccountTypeItem;
    coinInfo: CoinInfo;
};

const getAccountTypeKey = ({ symbol, type }: AccountTypeKey) => `${symbol}-${type}` as const;

export default class DiscoverAccounts extends AbstractMethod<'discoverAccounts', Request[]> {
    disposed = false;

    init() {
        this.requiredPermissions = ['read'];
        this.useDevice = true;
        this.useDeviceState = true;
        this.useUi = false;

        const { payload } = this;

        // validate bundle type
        validateParams(payload, [{ name: 'accounts', type: 'array' }]);

        this.params = payload.accounts.flatMap(item => {
            // validate incoming parameters
            validateParams(item, [
                { name: 'symbol', type: 'string', required: true },
                { name: 'type', type: 'string' },
                { name: 'identity', type: 'string' },
                { name: 'details', type: 'string' },
                { name: 'pageSize', type: 'number' },
            ]);

            const { symbol, type, ...rest } = item;

            // validate coin info
            const coinInfo = getCoinInfo(item.symbol);
            if (!coinInfo) {
                throw ERRORS.TypedError('Method_UnknownCoin');
            }

            // validate backend
            isBackendSupported(coinInfo);

            return ACCOUNT_TYPES.filter(a => a.symbol === symbol && (!type || a.type === type)).map(
                account => ({
                    pageSize: TXS_PER_PAGE,
                    details: DETAILS,
                    coinInfo,
                    account,
                    ...rest,
                }),
            );
        });
    }

    private progress: Partial<{ [key in ReturnType<typeof getAccountTypeKey>]: number }> = {};
    private updateProgress(account: AccountTypeKey, done: number, last = false) {
        const progress = last ? 1 : done / Math.max(ACCOUNT_LIMIT, done + 1);
        const key = getAccountTypeKey(account);
        this.progress[key] = progress;
    }

    private sendProgress(account: DiscoverAccountsProgress) {
        const progress =
            Object.values(this.progress).reduce((sum, typeProgress) => sum + typeProgress, 0) /
            // if no items in progress, divide by 1 instead of 0 as the numerator will be 0 anyway
            (Object.keys(this.progress).length || 1);

        this.postMessage(
            createUiMessage(UI.BUNDLE_PROGRESS, {
                total: 100,
                progress: 100 * progress,
                response: account,
            }),
        );
    }

    async run() {
        const accounts = this.params;

        accounts.forEach(({ account }) => this.updateProgress(account, 0));

        const counts = await Promise.all(accounts.map(account => this.discoverAccount(account)));
        const nonempty = counts.reduce((sum, n) => sum + n, 0);
        const empty = counts.length;

        return { empty, nonempty };
    }

    private readonly descriptorLock = getSynchronize();
    private async getDescriptor(coinInfo: CoinInfo, bip43PathTemplate: string, index: number) {
        const path = bip43PathTemplate.replace('i', String(index)); // TODO use substituteBip43Path from wallet-utils somehow

        const { address_n: _, ...descriptorRest } = await this.descriptorLock(() => {
            const address_n = validatePath(path, 3);

            return this.device.getCommands().getAccountDescriptor(coinInfo, address_n);
        });

        return { path, ...descriptorRest };
    }

    private async discoverAccount(request: Request) {
        const { details, identity, pageSize, coinInfo } = request;
        const { path, ...accountKey } = request.account;
        const blockchain = await initBlockchain(coinInfo, this.postMessage, identity);
        const utxoRequired = isUtxoBased(coinInfo) && details && details !== 'basic';

        let index = 0;
        let descPromise = this.getDescriptor(coinInfo, path, index);

        while (true) {
            const { descriptor, ...descRest } = await descPromise;
            descPromise = this.getDescriptor(coinInfo, path, index + 1);

            const info = await blockchain.getAccountInfo({ descriptor, details, pageSize });

            // eslint-disable-next-line no-nested-ternary
            const utxo = !utxoRequired
                ? undefined
                : info.empty
                  ? []
                  : await blockchain.getAccountUtxo(descriptor);

            this.updateProgress(accountKey, index + 1, info.empty);
            this.sendProgress({ ...info, descriptor, ...descRest, utxo, ...accountKey, index });

            if (info.empty) {
                await descPromise.catch(() => {});

                return index;
            }

            index++;
        }
    }

    dispose() {
        this.disposed = true;
    }
}
