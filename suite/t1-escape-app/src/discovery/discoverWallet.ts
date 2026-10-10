import { type Result, err, ok } from '@trezor/type-utils';

import {
    type DiscoveryError,
    MAX_AUTOMATIC_ACCOUNTS,
    type ScannedAccount,
    isWalletEmpty,
    scanAccountRange,
} from './discoverAccounts';
import {
    type EthereumDiscoveryError,
    type EthereumScannedAddress,
    isEthereumWalletEmpty,
    scanEthereumPathFamilies,
} from './discoverEthereumAddresses';
import { discoverWalletCandidates } from './discoverWalletCandidates';
import type { WalletKind } from './scanReport';
import { diagnosticLog } from '../app/diagnosticLog';
import type { Backend, BackendError } from '../backend/backend';
import type { AccountType } from '../bitcoin/accountType';
import type { DeviceCall } from '../device/deviceSession';
import type { PassphraseCandidates } from '../device/passphrase';
import { ETHEREUM_CHAINS, type EthereumChain } from '../ethereum/ethereumChain';

/**
 * Errors that stop the whole discovery, because the device could not be read. A server error
 * stops only the coin that server serves.
 */
export type DiscoveryAbortError = Exclude<DiscoveryError | EthereumDiscoveryError, BackendError>;

export type EthereumChainScan = {
    addresses: EthereumScannedAddress[];
    /** Set when the chain's server failed. The addresses are the ones reached before. */
    error?: BackendError;
};

/** What one pass over the wallet the device currently unlocks found, coin by coin. */
export type WalletScan = {
    accounts: ScannedAccount[];
    /** Set when the Bitcoin server failed. The accounts are the ones reached before. */
    bitcoinError?: BackendError;
    /** Chains that were not scanned are listed with no addresses and no error. */
    ethereum: Record<EthereumChain, EthereumChainScan>;
};

export type DiscoveredWallet = WalletScan & {
    walletKind: WalletKind;
};

export type DiscoverWalletParams = {
    call: DeviceCall;
    backend: Backend;
    accountTypes: readonly AccountType[];
    /** Chains scanned after Bitcoin. Empty on firmware that cannot sign Ethereum. */
    ethereumChains: readonly EthereumChain[];
    /** Present when the device has passphrase protection turned on. */
    passphraseCandidates?: PassphraseCandidates;
    /** Chooses the passphrase the session answers with when the device asks for one. */
    setActivePassphrase: (passphrase: string) => void;
    onAccountScanned?: (account: ScannedAccount) => void;
    onAddressScanned?: (address: EthereumScannedAddress) => void;
};

type CoinScan<T> = {
    scanned: T[];
    error?: BackendError;
};

type ScanAllAccountTypesParams = Pick<
    DiscoverWalletParams,
    'call' | 'backend' | 'accountTypes' | 'onAccountScanned'
>;

const scanAllAccountTypes = async ({
    accountTypes,
    ...params
}: ScanAllAccountTypesParams): Promise<Result<ScannedAccount[], DiscoveryError>> => {
    const accounts: ScannedAccount[] = [];

    for (const accountType of accountTypes) {
        const scanned = await scanAccountRange({
            ...params,
            accountType,
            firstIndex: 0,
            count: MAX_AUTOMATIC_ACCOUNTS,
            stopAtFirstEmpty: true,
        });
        if (!scanned.success) return scanned;

        accounts.push(...scanned.payload);
    }

    return ok(accounts);
};

// A server error ends the coin it serves and keeps what was reached, so that the other coins
// can still be found and moved. A device error ends the whole discovery.
const settleCoinScan = <T>(
    result: Result<T[], DiscoveryError | EthereumDiscoveryError>,
    reached: T[],
): Result<CoinScan<T>, DiscoveryAbortError> => {
    if (result.success) return ok({ scanned: result.payload });

    if (result.error.type === 'backend') return ok({ scanned: reached, error: result.error });

    return err(result.error);
};

const NOT_SCANNED: EthereumChainScan = { addresses: [] };

const countUsed = (scanned: readonly { isEmpty: boolean }[]) =>
    scanned.filter(({ isEmpty }) => !isEmpty).length;

// A coin whose server failed is not known to be empty, so neither is the wallet: the raw
// passphrase is never tried on partial information.
const isWalletScanEmpty = ({ accounts, bitcoinError, ethereum }: WalletScan) =>
    bitcoinError === undefined &&
    isWalletEmpty(accounts) &&
    ETHEREUM_CHAINS.every(
        chain =>
            ethereum[chain].error === undefined && isEthereumWalletEmpty(ethereum[chain].addresses),
    );

/**
 * Runs the discovery of every coin in the wallet the device currently unlocks, on one device
 * session: the Bitcoin account types first, then each Ethereum chain. The passphrase candidates
 * are tried the way `discoverWalletCandidates` describes, judged over all coins at once.
 */
export const discoverWallet = async ({
    call,
    backend,
    accountTypes,
    ethereumChains,
    passphraseCandidates,
    setActivePassphrase,
    onAccountScanned,
    onAddressScanned,
}: DiscoverWalletParams): Promise<Result<DiscoveredWallet, DiscoveryAbortError>> => {
    const scanBitcoin = async () => {
        const reached: ScannedAccount[] = [];
        const scanned = await scanAllAccountTypes({
            call,
            backend,
            accountTypes,
            onAccountScanned: account => {
                reached.push(account);
                onAccountScanned?.(account);
            },
        });
        const settled = settleCoinScan(scanned, reached);
        if (!settled.success) return settled;

        const { scanned: accounts, error } = settled.payload;
        if (error) {
            diagnosticLog.error('discovery', 'bitcoin scan stopped at a server error', {
                accounts: accounts.length,
                error,
            });
        } else {
            diagnosticLog.info('discovery', 'bitcoin scanned', {
                accounts: accounts.length,
                usedAccounts: countUsed(accounts),
            });
        }

        return settled;
    };

    const scanEthereumChain = async (chain: EthereumChain) => {
        const reached: EthereumScannedAddress[] = [];
        const scanned = await scanEthereumPathFamilies({
            call,
            backend: backend.ethereum[chain],
            chain,
            onAddressScanned: address => {
                reached.push(address);
                onAddressScanned?.(address);
            },
        });
        const settled = settleCoinScan(scanned, reached);
        if (!settled.success) return settled;

        const { scanned: addresses, error } = settled.payload;
        if (error) {
            diagnosticLog.error('discovery', 'chain scan stopped at a server error', {
                chain,
                addresses: addresses.length,
                error,
            });
        } else {
            diagnosticLog.info('discovery', 'chain scanned', {
                chain,
                addresses: addresses.length,
                usedAddresses: countUsed(addresses),
            });
        }

        return settled;
    };

    const scan = async (): Promise<Result<WalletScan, DiscoveryAbortError>> => {
        const bitcoin = await scanBitcoin();
        if (!bitcoin.success) return bitcoin;

        const ethereum: Record<EthereumChain, EthereumChainScan> = {
            ethereum: NOT_SCANNED,
            'ethereum-classic': NOT_SCANNED,
        };
        for (const chain of ethereumChains) {
            const scanned = await scanEthereumChain(chain);
            if (!scanned.success) return scanned;

            ethereum[chain] = { addresses: scanned.payload.scanned, error: scanned.payload.error };
        }

        return ok({
            accounts: bitcoin.payload.scanned,
            bitcoinError: bitcoin.payload.error,
            ethereum,
        });
    };

    const discovered = await discoverWalletCandidates({
        call,
        passphraseCandidates,
        setActivePassphrase,
        scan,
        isWalletEmpty: isWalletScanEmpty,
    });
    if (!discovered.success) return discovered;

    const { walletKind, scanned } = discovered.payload;

    return ok({ walletKind, ...scanned });
};
