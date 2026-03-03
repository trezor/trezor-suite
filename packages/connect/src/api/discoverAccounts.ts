// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import { ERRORS } from '@trezor/connect-common/src/constants';
import { arrayPartition, getSynchronize, versionUtils } from '@trezor/utils';

import { initBlockchain, isBackendSupported } from '../backend/BlockchainLink';
import {
    CARDANO_TXS_PER_PAGE,
    DEFAULT_TXS_PER_PAGE,
    SOLANA_TXS_PER_PAGE,
} from '../constants/paging';
import {
    AbstractMethod,
    DEFAULT_FIRMWARE_RANGE,
    MethodPermission,
    Payload,
} from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import type { AccountDescriptor } from '../device/DeviceCommands';
import { UI_REQUEST, createUiMessage } from '../events';
import { checkXPubWithHashes } from './firmware';
import type { CoinInfo, EntropyCheckResult, FirmwareRange } from '../types';
import {
    ACCOUNT_TYPES,
    AccountTypeItem,
    AccountTypeKey,
    AdditionalParams,
    CARDANO_DERIVATIONS,
    DiscoverAccountsProgress,
} from '../types/api/discoverAccounts';
import { isUtxoBased } from '../utils/accountUtils';
import { validatePath } from '../utils/pathUtils';
import { getFirmwareRange, validateParams } from './common/paramsValidator';

const ACCOUNT_LIMIT = 10;
const DETAILS = 'txs';

type CardanoDerivation = (typeof CARDANO_DERIVATIONS)[keyof typeof CARDANO_DERIVATIONS];

type Request = AdditionalParams & {
    account: AccountTypeItem;
    derivation?: CardanoDerivation;
    firmwareRange: FirmwareRange;
    coinInfo: CoinInfo;
    offset: number;
    skip: number;
};
// Internal representation of parameters after transformation, see types/api file for the external type interface.
type DiscoverAccountsLocalParams = { coins: Request[]; entropyCheckResult?: EntropyCheckResult };

type CardanoTypeItem = Extract<AccountTypeItem, { symbol: 'ada' }>;

type CardanoRequest = Request & { account: CardanoTypeItem };

const isCardano = (account: AccountTypeItem): account is CardanoTypeItem =>
    account.symbol === 'ada';

const isCardanoRequest = (request: Request): request is CardanoRequest =>
    isCardano(request.account);

const isEvmLedger = (account: AccountTypeItem, coinInfo: CoinInfo) =>
    coinInfo.type === 'ethereum' && account.type === 'ledger';

const getAccountTypeKey = ({ symbol, type }: AccountTypeKey) => `${symbol}-${type}` as const;

// TODO use substituteBip43Path from wallet-utils somehow
const substituteBip43Path = (path: string, index: number) => path.replace('i', String(index));

export const getTxsPerPage = (account: AccountTypeItem) => {
    switch (account.symbol) {
        case 'ada':
            return CARDANO_TXS_PER_PAGE;
        case 'sol':
            return SOLANA_TXS_PER_PAGE;
        default:
            return DEFAULT_TXS_PER_PAGE;
    }
};

export default class DiscoverAccounts extends AbstractMethod<
    'discoverAccounts',
    DiscoverAccountsLocalParams
> {
    disposed = false;

    constructor(message: { id?: number; payload: Payload<'discoverAccounts'> }) {
        super(message);
        this.useDevice = true;
        this.useDeviceState = true;
        this.useUi = false;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        const { payload } = this;
        const { entropyCheckResult } = payload;

        // validate bundle type
        validateParams(payload, [
            { name: 'coins', type: 'array', required: true, allowEmpty: true },
            { name: 'entropyCheckResult', type: 'object' },
        ]);

        const coins: Request[] = payload.coins.flatMap(coin => {
            // validate incoming parameters
            validateParams(coin, [
                { name: 'symbol', type: 'string', required: true },
                { name: 'known', type: 'array', allowEmpty: true },
                { name: 'knownOnly', type: 'boolean' },
                { name: 'identity', type: 'string' },
                { name: 'details', type: 'string' },
                { name: 'pageSize', type: 'number' },
            ]);

            const { symbol, known: knownAccs, knownOnly, ...rest } = coin;

            // validate coin info
            const coinInfo = getCoinInfo(symbol);
            if (!coinInfo) {
                throw ERRORS.TypedError('Method_UnknownCoin');
            }

            // validate backend
            isBackendSupported(coinInfo);

            const firmwareRange = getFirmwareRange(this.name, coinInfo, DEFAULT_FIRMWARE_RANGE);

            // Take all the defined account types based on requested coin symbol
            const symbolAccounts = ACCOUNT_TYPES.filter(a => a.symbol === symbol);

            knownAccs?.forEach(account => {
                validateParams(account, [
                    { name: 'type', type: 'string', required: true },
                    { name: 'skip', type: 'number' },
                ]);
                // Do not try to explicitly request account type which doesn't exist for requested coin
                if (!symbolAccounts.some(a => a.type === account.type)) {
                    throw new Error(`Unknown account type: ${symbol}/${account.type}`);
                }
            });

            return symbolAccounts
                .map(account => [account, knownAccs?.find(t => t.type === account.type)] as const) // Pair all coin accounts with possibly known account types
                .filter(([_, known]) => (known ? typeof known.skip === 'number' : !knownOnly)) // Include passed known accounts with skip param (the other ones are known completely) and unpassed accounts if knownOnly wasn't requested
                .map(([account, known]) => ({
                    pageSize: getTxsPerPage(account),
                    details: DETAILS,
                    coinInfo,
                    firmwareRange,
                    skip: known?.skip ?? 0, // Use the possibly passed skip param or fall back to zero
                    account,
                    ...rest,
                    offset: isEvmLedger(account, coinInfo) ? 1 : 0,
                    derivation: isCardano(account) ? CARDANO_DERIVATIONS[account.type] : undefined,
                }));
        });

        this.params = { coins, entropyCheckResult };
    }

    private progress: Partial<{ [key in ReturnType<typeof getAccountTypeKey>]: number }> = {};
    private updateProgress(account: AccountTypeKey, done: number, last = false) {
        const progress = last ? 1 : done / Math.max(ACCOUNT_LIMIT, done + 1);
        const key = getAccountTypeKey(account);
        this.progress[key] = progress;
    }

    private sendProgress(response: DiscoverAccountsProgress) {
        const progress =
            Object.values(this.progress).reduce((sum, typeProgress) => sum + typeProgress, 0) /
            // if no items in progress, divide by 1 instead of 0 as the numerator will be 0 anyway
            (Object.keys(this.progress).length || 1);

        this.postMessage(
            createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
                total: 100,
                progress: 100 * progress,
                response,
            }),
        );
    }

    async run() {
        const [unsupported, supported] = this.filterUnsupportedAccounts(this.params.coins);

        unsupported.forEach(
            ({ account: { path: bip43, ...rest }, error, coinInfo, skip, offset }) => {
                const path = substituteBip43Path(bip43, skip + offset);
                const backendType = coinInfo.blockchainLink?.type;
                this.sendProgress({ ...rest, index: skip, failed: true, error, path, backendType });
            },
        );

        const [cardanoAccounts, otherAccounts] = arrayPartition(supported, isCardanoRequest);
        const [_, filteredCardanoAccounts] = await this.filterCardanoDerivations(cardanoAccounts);
        const accounts = [...otherAccounts, ...filteredCardanoAccounts];

        accounts.forEach(({ account, skip }) => this.updateProgress(account, skip));

        const counts = await Promise.all(accounts.map(account => this.discoverAccount(account)));
        const nonempty = counts.reduce((sum, acc) => sum + acc.nonempty, 0);
        const failed = counts.filter(acc => acc.error).length;
        const empty = counts.length - failed;

        return { empty, nonempty, failed };
    }

    private filterUnsupportedAccounts(accounts: Request[]) {
        const version = this.device.getVersion();
        const model = this.device.features?.internal_model;

        if (!version || !model) return [[], accounts] as const;

        return arrayPartition(
            accounts.map(item => {
                const { min, max } = item.firmwareRange[model];

                let error;
                if (min === '0') {
                    error = UI_REQUEST.FIRMWARE_NOT_SUPPORTED;
                } else if (!versionUtils.isNewerOrEqual(version, min)) {
                    error = UI_REQUEST.FIRMWARE_OLD;
                } else if (max !== '0' && versionUtils.isNewer(version, max)) {
                    error = UI_REQUEST.FIRMWARE_NOT_COMPATIBLE;
                }

                return error ? { ...item, error } : item;
            }),
            item => 'error' in item,
        );
    }

    /** This should have zero overhead thanks to descriptor caching */
    private async filterCardanoDerivations(accounts: CardanoRequest[]) {
        const legacyRequest = accounts.find(a => a.account.type === 'legacy');
        const ledgerRequest = accounts.find(a => a.account.type === 'ledger');
        const filterableRequest = legacyRequest ?? ledgerRequest;

        const getDescriptor = (derivation: keyof typeof CARDANO_DERIVATIONS) =>
            filterableRequest &&
            this.getDescriptor(
                filterableRequest.coinInfo,
                filterableRequest.account.path,
                CARDANO_DERIVATIONS[derivation],
                0,
            ).then(({ descriptor }) => descriptor);

        // normal descriptor or undefined when no legacy/ledger was requested as in that case it's useless
        const normalDescriptor = await getDescriptor('normal');

        // legacy omitted if it's requested and has the same descriptor as normal
        const omitLegacy = legacyRequest && (await getDescriptor('legacy')) === normalDescriptor;

        // ledger omitted if it's requested and has the same descriptor as normal,
        // but if legacy was already checked and not omitted, ledger won't be as well
        const omitLedger =
            ledgerRequest &&
            (!legacyRequest || omitLegacy) &&
            (await getDescriptor('ledger')) === normalDescriptor;

        return arrayPartition(
            accounts.map(item =>
                (item.account.type === 'legacy' && omitLegacy) ||
                (item.account.type === 'ledger' && omitLedger)
                    ? { ...item, error: 'ignored cardano derivation' as const }
                    : item,
            ),
            item => 'error' in item,
        );
    }

    private readonly descriptorLock = getSynchronize();
    private readonly descriptorCache: Record<string, AccountDescriptor | undefined> = {};
    private async getDescriptor(
        coinInfo: CoinInfo,
        bip43PathTemplate: string,
        derivationType: CardanoDerivation | undefined,
        index: number,
    ) {
        const path = substituteBip43Path(bip43PathTemplate, index);

        const { address_n: _, ...descriptorRest } = await this.descriptorLock(async () => {
            const key = `${path}-${derivationType}`;
            if (!this.descriptorCache[key]) {
                // This works because descriptors returned from getAccountDescriptor depend only
                // on derivation path (plus type in case of Cardano). When there's a case where
                // we expect two different descriptors from the same path, this must be reworked.
                const address_n = validatePath(path, 3);
                const descriptor = await this.device
                    .getCommands()
                    .getAccountDescriptor(coinInfo, address_n, derivationType);
                this.descriptorCache[key] = descriptor;

                // Perform continuous entropy check for standard wallet, if data are available
                const knownXPubHashes = this.params.entropyCheckResult?.xpubHashes;
                const { legacyXpub: xpub } = descriptor; // only Bitcoin-like accounts have it, and only those are checked for now
                const isPassphraseEnabled = this.device.features?.passphrase_protection;
                const alwaysPassphrase = this.device.features?.passphrase_always_on_device; // if this feature is on, then useEmptyPassphrase is not reliable
                const isStandardWallet =
                    !isPassphraseEnabled || (this.useEmptyPassphrase && !alwaysPassphrase);
                if (xpub && knownXPubHashes && isStandardWallet) {
                    const isValid = checkXPubWithHashes({ xpub, path, knownXPubHashes });
                    if (!isValid) {
                        // TODO monitor this, and if the check is reliable, throw error to fail the account discovery, have Suite handle it
                        console.error(`Entropy check failed at getAccountDescriptor on ${path}`);
                    }
                }
            }

            return this.descriptorCache[key];
        });

        return { path, ...descriptorRest };
    }

    private async discoverAccount(request: Request): Promise<{ nonempty: number; error?: string }> {
        const { details, identity, pageSize, coinInfo, derivation, offset, skip } = request;
        const { path: bip43, ...accountKey } = request.account;
        const backendType = coinInfo.blockchainLink?.type;
        const utxoRequired = isUtxoBased(coinInfo) && details && details !== 'basic';
        let index = skip;

        let blockchain;
        try {
            blockchain = await initBlockchain(coinInfo, this.postMessage, identity);
        } catch (err) {
            const path = substituteBip43Path(bip43, offset + index);
            this.updateProgress(accountKey, index + 1, true);
            const error = err.message;
            this.sendProgress({ ...accountKey, index, failed: true, error, path, backendType });

            return { nonempty: 0, error };
        }

        let descPromise = this.getDescriptor(coinInfo, bip43, derivation, offset + index);
        descPromise.catch(() => {});
        while (true) {
            try {
                const { descriptor, ...descRest } = await descPromise;
                descPromise = this.getDescriptor(coinInfo, bip43, derivation, offset + index + 1);
                descPromise.catch(() => {});

                const info = await blockchain.getAccountInfo({ descriptor, details, pageSize });

                // eslint-disable-next-line no-nested-ternary
                const utxo = !utxoRequired
                    ? undefined
                    : info.empty
                      ? []
                      : await blockchain.getAccountUtxo(descriptor);

                this.updateProgress(accountKey, index + 1, info.empty);
                this.sendProgress({
                    ...info,
                    descriptor,
                    ...descRest,
                    utxo,
                    ...accountKey,
                    index,
                    backendType,
                    failed: false,
                });

                if (info.empty) {
                    await descPromise.catch(() => {});

                    return { nonempty: index - skip };
                }
            } catch (err) {
                const path = substituteBip43Path(bip43, offset + index);
                const { message: error, code } = err;
                const failed = true;
                this.updateProgress(accountKey, index + 1, true);
                this.sendProgress({ ...accountKey, index, failed, error, code, path, backendType });

                return { nonempty: index - skip, error };
            }

            index++;
        }
    }

    dispose() {
        this.disposed = true;
    }
}
