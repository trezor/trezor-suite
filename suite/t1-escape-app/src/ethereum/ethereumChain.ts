import { formatPath } from '../bitcoin/accountType';

/** Chains the migration can sweep. Both use the same legacy signing messages of the firmware. */
export type EthereumChain = 'ethereum' | 'ethereum-classic';

export type EthereumChainDefinition = {
    /** EIP-155 chain id, sent to the device and part of the signature. */
    chainId: number;
    label: string;
    symbol: 'ETH' | 'ETC';
    blockbookUrl: string;
    /**
     * SLIP-44 coin types whose `m/44'/<coin>'/0'/0/i` addresses are scanned, in scan order.
     * Ethereum Classic also scans the Ethereum paths: wallets from 2016 to 2018 kept their ETC on
     * the ETH keys after the fork.
     */
    slip44s: number[];
};

export const ETHEREUM_CHAIN_DEFINITIONS: Record<EthereumChain, EthereumChainDefinition> = {
    ethereum: {
        chainId: 1,
        label: 'Ethereum',
        symbol: 'ETH',
        blockbookUrl: 'https://eth.trezor.io',
        slip44s: [60],
    },
    'ethereum-classic': {
        chainId: 61,
        label: 'Ethereum Classic',
        symbol: 'ETC',
        blockbookUrl: 'https://etc.trezor.io',
        slip44s: [61, 60],
    },
};

export const ETHEREUM_CHAINS: EthereumChain[] = ['ethereum', 'ethereum-classic'];

export const ETHEREUM_BLOCKBOOK_URLS = ETHEREUM_CHAINS.map(
    chain => ETHEREUM_CHAIN_DEFINITIONS[chain].blockbookUrl,
);

const HARDENED = 0x80000000;

const BIP44_PURPOSE = 44;

const toHardened = (index: number) => (index | HARDENED) >>> 0;

/** Address path `m / 44' / coin' / 0' / 0 / index`, one account and the external chain only. */
export const getEthereumAddressPath = (slip44: number, index: number): number[] => [
    toHardened(BIP44_PURPOSE),
    toHardened(slip44),
    toHardened(0),
    0,
    index,
];

/** The scanned path family written as a pattern, e.g. `m/44'/60'/0'/0/i`. */
export const formatEthereumPathFamily = (slip44: number) =>
    `${formatPath(getEthereumAddressPath(slip44, 0).slice(0, -1))}/i`;
