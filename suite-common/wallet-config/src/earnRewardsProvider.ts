import { type NetworkSymbol } from './types';

const MERKL_XYZ_CONTRACT: Partial<Record<NetworkSymbol, `0x${string}`>> = {
    eth: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    arb: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    base: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    op: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
};

export const isEarnYieldClaimSupported = (networkSymbol: NetworkSymbol) =>
    MERKL_XYZ_CONTRACT[networkSymbol] !== undefined;

export const getEarnYieldClaimContractAddress = (networkSymbol: NetworkSymbol) =>
    MERKL_XYZ_CONTRACT[networkSymbol];
