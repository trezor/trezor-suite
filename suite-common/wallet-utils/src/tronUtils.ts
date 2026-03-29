import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';
import { tronUtils } from '@trezor/blockchain-link-utils';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit } from './AmountTypes';
import { subunitsToUnits } from './amountUtils';

export type TronFeeBreakdown = {
    trxBurned: BigNumber;
    coveredEnergy: BigNumber;
    coveredBandwidth: BigNumber;
};

export const calculateTronFeeBreakdown = (
    tx: GeneralPrecomposedTransaction | undefined,
    tronResources: TronAccountExtraData | undefined,
    symbol: NetworkSymbol,
): TronFeeBreakdown | null => {
    if (!tx || tx.type === 'error' || !('bytes' in tx)) return null;

    const availableStakedBandwidth = tronResources?.availableStakedBandwidth ?? 0;
    const availableFreeBandwidth = tronResources?.availableFreeBandwidth ?? 0;
    const availableEnergy = tronResources?.availableEnergy ?? 0;
    const energyConsumed = 'energyConsumed' in tx ? (tx.energyConsumed ?? 0) : 0;
    const bandwidthBytes = tx.bytes ?? 0;

    const isBandwidthCovered =
        Math.max(availableStakedBandwidth, availableFreeBandwidth) >= bandwidthBytes;
    const coveredBandwidth = new BigNumber(isBandwidthCovered ? bandwidthBytes : 0);
    const coveredEnergy = new BigNumber(Math.min(availableEnergy, energyConsumed));

    const bandwidthBurnSun = isBandwidthCovered
        ? 0
        : bandwidthBytes * tronUtils.TRON_BANDWIDTH_SUN_PRICE;
    const energyBurnSun = new BigNumber(energyConsumed - coveredEnergy.toNumber()).multipliedBy(
        tx.feePerByte ?? '0',
    );
    const totalBurnSun = energyBurnSun.plus(bandwidthBurnSun);
    const trxBurned = new BigNumber(
        subunitsToUnits({ value: asAmountSubunit(totalBurnSun), symbol }),
    );

    return { trxBurned, coveredEnergy, coveredBandwidth };
};
