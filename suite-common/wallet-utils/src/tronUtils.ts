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

const toTrx = (sun: BigNumber, symbol: NetworkSymbol) =>
    new BigNumber(subunitsToUnits({ value: asAmountSubunit(sun), symbol }));

export const calculateTronFeeBreakdown = (
    tx: GeneralPrecomposedTransaction | undefined,
    tronResources: TronAccountExtraData | undefined,
    symbol: NetworkSymbol,
    feeLimitSunOverride?: string,
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

    const isTRC20Transfer = 'token' in tx && tx.token !== undefined;

    if (!isTRC20Transfer) {
        const trxBurned = isBandwidthCovered
            ? new BigNumber(0)
            : toTrx(new BigNumber(bandwidthBytes * tronUtils.TRON_BANDWIDTH_SUN_PRICE), symbol);

        return { trxBurned, coveredEnergy, coveredBandwidth };
    }

    const energyPrice = tx.feePerByte ?? '0';
    const bandwidthBurnSun = new BigNumber(
        isBandwidthCovered ? 0 : bandwidthBytes * tronUtils.TRON_BANDWIDTH_SUN_PRICE,
    );

    const feeLimitSun = feeLimitSunOverride != null ? new BigNumber(feeLimitSunOverride) : null;

    const energyBurnSun =
        feeLimitSun != null
            ? BigNumber.max(
                  feeLimitSun.minus(new BigNumber(availableEnergy).multipliedBy(energyPrice)),
                  0,
              )
            : new BigNumber(energyConsumed - coveredEnergy.toNumber()).multipliedBy(energyPrice);

    const trxBurned = toTrx(energyBurnSun.plus(bandwidthBurnSun), symbol);

    return { trxBurned, coveredEnergy, coveredBandwidth };
};
