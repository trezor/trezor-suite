import type { EthereumScannedAddress } from './discoverEthereumAddresses';
import type { WalletKind } from './scanReport';
import {
    ETHEREUM_CHAIN_DEFINITIONS,
    type EthereumChain,
    formatEthereumPathFamily,
} from '../ethereum/ethereumChain';

export type EthereumPathFamilyReport = {
    slip44: number;
    /** The scanned path pattern, e.g. `m/44'/60'/0'/0/i`. */
    pattern: string;
    /** Number of address indexes looked at, including the empty one that ended the walk. */
    scannedAddresses: number;
    usedAddresses: number;
};

export type EthereumScanReport = {
    chain: EthereumChain;
    label: string;
    symbol: 'ETH' | 'ETC';
    walletKind: WalletKind;
    pathFamilies: EthereumPathFamilyReport[];
};

export type BuildEthereumScanReportParams = {
    chain: EthereumChain;
    addresses: readonly EthereumScannedAddress[];
    walletKind: WalletKind;
};

/** Summarises the scope of the scan: what was searched, so that the rest can be named too. */
export const buildEthereumScanReport = ({
    chain,
    addresses,
    walletKind,
}: BuildEthereumScanReportParams): EthereumScanReport => {
    const { label, symbol, slip44s } = ETHEREUM_CHAIN_DEFINITIONS[chain];

    return {
        chain,
        label,
        symbol,
        walletKind,
        pathFamilies: slip44s.map(slip44 => {
            const ofFamily = addresses.filter(({ account }) => account.slip44 === slip44);

            return {
                slip44,
                pattern: formatEthereumPathFamily(slip44),
                scannedAddresses: ofFamily.length,
                usedAddresses: ofFamily.filter(({ isEmpty }) => !isEmpty).length,
            };
        }),
    };
};
