import type { EthereumNetworkSymbol } from './networkSymbol';

type NativeErc20Token = {
    readonly contract: `0x${string}`;
    readonly symbol: string;
    readonly decimals: number;
};

const ARC_NATIVE_ERC20: NativeErc20Token = {
    contract: '0x3600000000000000000000000000000000000000',
    symbol: 'USDC',
    decimals: 6,
};

export const NATIVE_ERC20: Readonly<Partial<Record<EthereumNetworkSymbol, NativeErc20Token>>> = {
    arc: ARC_NATIVE_ERC20,
    tarc: ARC_NATIVE_ERC20,
};

export const getNativeErc20Token = (networkSymbol: EthereumNetworkSymbol) =>
    NATIVE_ERC20[networkSymbol];
