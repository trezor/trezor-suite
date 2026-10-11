import type { Address } from 'viem';

import type { EthereumChain } from './ethereumChain';

/** One address of the wallet. On these chains an account is a single address. */
export type EthereumAccount = {
    chain: EthereumChain;
    /** SLIP-44 coin type of the path family the address was derived in. */
    slip44: number;
    index: number;
    path: number[];
    /** EIP-55 checksummed, as the device derived it. */
    address: Address;
};

export const getEthereumAccountKey = ({ slip44, index }: EthereumAccount) => `${slip44}-${index}`;

/** How the account is named in the log: never by its address. */
export const describeEthereumAccount = ({ chain, slip44, index }: EthereumAccount) =>
    `${chain} ${slip44}'/${index}`;
