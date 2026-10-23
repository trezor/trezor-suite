import type { ScannedAccount } from './discoverAccounts';
import type { EthereumScannedAddress } from './discoverEthereumAddresses';
import { type EthereumScanReport, buildEthereumScanReport } from './ethereumScanReport';
import { type ScanReport, type WalletKind, buildScanReport } from './scanReport';
import type { AccountType } from '../bitcoin/accountType';
import { ETHEREUM_CHAIN_DEFINITIONS, type EthereumChain } from '../ethereum/ethereumChain';

export type WalletScanReport = {
    walletKind: WalletKind;
    bitcoin: ScanReport;
    /** One per chain the firmware can sign for, in scan order. Empty when it cannot sign Ethereum. */
    ethereum: EthereumScanReport[];
    /** Coins whose scan stopped at a server error. What they list is only what was reached. */
    interruptedCoins: string[];
};

export type ScannedEthereumChainReportParams = {
    chain: EthereumChain;
    addresses: readonly EthereumScannedAddress[];
    /** The chain's server failed: the addresses are the ones reached before. */
    isInterrupted: boolean;
};

export type BuildWalletScanReportParams = {
    walletKind: WalletKind;
    accounts: readonly ScannedAccount[];
    scannedAccountTypes: readonly AccountType[];
    /** The Bitcoin server failed: the accounts are the ones reached before. */
    isBitcoinInterrupted: boolean;
    /** The chains that were scanned. Empty on firmware that cannot sign Ethereum. */
    ethereum: readonly ScannedEthereumChainReportParams[];
};

/** Summarises the scope of the whole scan, coin by coin, so that the rest can be named too. */
export const buildWalletScanReport = ({
    walletKind,
    accounts,
    scannedAccountTypes,
    isBitcoinInterrupted,
    ethereum,
}: BuildWalletScanReportParams): WalletScanReport => ({
    walletKind,
    bitcoin: buildScanReport({ accounts, scannedAccountTypes, walletKind }),
    ethereum: ethereum.map(({ chain, addresses }) =>
        buildEthereumScanReport({ chain, addresses, walletKind }),
    ),
    interruptedCoins: [
        ...(isBitcoinInterrupted ? ['Bitcoin'] : []),
        ...ethereum
            .filter(({ isInterrupted }) => isInterrupted)
            .map(({ chain }) => ETHEREUM_CHAIN_DEFINITIONS[chain].label),
    ],
});
