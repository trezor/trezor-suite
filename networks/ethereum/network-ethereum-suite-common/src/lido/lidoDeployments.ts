import {
    type EthereumNetworkSymbol,
    isSupportedEthereumNetwork,
} from '@trezor/network-ethereum-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { type EvmAddress, asEvmAddress } from '../calldata/types/evm';

export const LIDO_WITHDRAWAL_NFT = {
    name: 'Lido Withdrawal NFT (unstETH)',
    symbol: 'unstETH',
} as const;

export type LidoDeployment = {
    stETH: EvmAddress;
    wstETH: EvmAddress;
    wstETHReferralStaker: EvmAddress;
    withdrawalQueue: EvmAddress;
};

// Lowercase, as the calldata decoders and the clear signing tables keep addresses.
const LIDO_DEPLOYMENTS: Partial<Record<EthereumNetworkSymbol, LidoDeployment>> = {
    eth: {
        stETH: asEvmAddress('0xae7ab96520de3a18e5e111b5eaab095312d7fe84'),
        wstETH: asEvmAddress('0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'),
        wstETHReferralStaker: asEvmAddress('0xa88f0329c2c4ce51ba3fc619bbf44efe7120dd0d'),
        withdrawalQueue: asEvmAddress('0x889edc2edab5f40e902b864ad4d7ade8e412f9b1'),
    },
};

const getEthereumLidoDeployment = (networkSymbol: EthereumNetworkSymbol): LidoDeployment | null =>
    LIDO_DEPLOYMENTS[networkSymbol] ?? null;

export const getLidoDeployment = (networkSymbol: NetworkSymbol): LidoDeployment | null =>
    isSupportedEthereumNetwork(networkSymbol) ? getEthereumLidoDeployment(networkSymbol) : null;

// TODO: Replace with the address Lido attributes Trezor's stake to once it is agreed with the
// Rewards-Share Committee. The zero address stakes without a referral.
export const LIDO_REFERRAL_ADDRESS = asEvmAddress('0x0000000000000000000000000000000000000000');

// The queue takes at most 1000 stETH in one request; a larger withdrawal is split into several.
export const LIDO_MAX_STETH_WITHDRAWAL_AMOUNT = 1000n * 10n ** 18n;

export const LIDO_MIN_STETH_WITHDRAWAL_AMOUNT = 100n;
