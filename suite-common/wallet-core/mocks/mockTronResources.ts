import { type TronAccountExtraData } from '@trezor/blockchain-link-types';

export const mockTronResources = (
    overrides: Partial<TronAccountExtraData> = {},
): TronAccountExtraData => ({
    availableStakedBandwidth: 0,
    totalStakedBandwidth: 0,
    availableFreeBandwidth: 600,
    totalFreeBandwidth: 600,
    availableEnergy: 0,
    totalEnergy: 0,
    totalEnergyLimit: 0,
    totalEnergyWeight: 0,
    totalBandwidthLimit: 0,
    totalBandwidthWeight: 0,
    ...overrides,
});
