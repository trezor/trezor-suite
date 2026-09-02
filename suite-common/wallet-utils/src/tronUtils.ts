import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { type ResponseTypes, type TronAccountExtraData } from '@trezor/blockchain-link-types';
import {
    TRON_BANDWIDTH_SUN_PRICE,
    TRON_CREATE_ACCOUNT_FEE_SUN,
} from '@trezor/network-tron/constants';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit } from './AmountTypes';
import { subunitsToUnits } from './amountUtils';

export type TronFeeLevel = ResponseTypes.EstimateFee['payload'][number];

export const computeBandwidthFeeLevel = ({
    availableStakedBandwidth,
    availableFreeBandwidth,
    bytes,
    isNewAccount = false,
}: {
    availableStakedBandwidth: number;
    availableFreeBandwidth: number;
    bytes: number;
    isNewAccount?: boolean;
}): TronFeeLevel => {
    if (isNewAccount) {
        const feeInSun = availableStakedBandwidth < bytes ? TRON_CREATE_ACCOUNT_FEE_SUN : 0;

        return {
            feePerTx: String(feeInSun),
            feePerUnit: String(TRON_BANDWIDTH_SUN_PRICE),
        };
    }

    const availableBandwidth = Math.max(availableStakedBandwidth, availableFreeBandwidth);
    const feeInSun = availableBandwidth < bytes ? bytes * TRON_BANDWIDTH_SUN_PRICE : 0;

    return {
        feePerTx: String(feeInSun),
        feePerUnit: String(TRON_BANDWIDTH_SUN_PRICE),
    };
};

export type TronFeeBreakdown = {
    trxBurned: BigNumber;
    coveredEnergy: BigNumber;
    coveredBandwidth: BigNumber;
    isAccountActivation: boolean;
};

export const isTronAccountActivation = (tx: GeneralPrecomposedTransaction | undefined) =>
    !!tx && 'accountActivationFee' in tx && !!tx.accountActivationFee;

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

    const isAccountActivation = isTronAccountActivation(tx);
    const isBandwidthCovered = isAccountActivation
        ? availableStakedBandwidth >= bandwidthBytes
        : Math.max(availableStakedBandwidth, availableFreeBandwidth) >= bandwidthBytes;
    const coveredBandwidth = new BigNumber(isBandwidthCovered ? bandwidthBytes : 0);
    const coveredEnergy = new BigNumber(Math.min(availableEnergy, energyConsumed));

    const isContractCall = 'feeLimit' in tx && tx.feeLimit !== undefined;

    if (!isContractCall) {
        return {
            trxBurned: toTrx(new BigNumber(tx.fee), symbol),
            coveredEnergy,
            coveredBandwidth,
            isAccountActivation,
        };
    }

    const memoFeeSun = new BigNumber(('memoFee' in tx && tx.memoFee) || 0);
    const energyPrice = tx.feePerByte ?? '0';
    const bandwidthBurnSun = new BigNumber(
        isBandwidthCovered ? 0 : bandwidthBytes * TRON_BANDWIDTH_SUN_PRICE,
    );

    const feeLimitSun = feeLimitSunOverride != null ? new BigNumber(feeLimitSunOverride) : null;

    const energyBurnSun =
        feeLimitSun != null
            ? BigNumber.max(
                  feeLimitSun.minus(new BigNumber(availableEnergy).multipliedBy(energyPrice)),
                  0,
              )
            : new BigNumber(energyConsumed - coveredEnergy.toNumber()).multipliedBy(energyPrice);

    const trxBurned = toTrx(energyBurnSun.plus(bandwidthBurnSun).plus(memoFeeSun), symbol);

    return { trxBurned, coveredEnergy, coveredBandwidth, isAccountActivation };
};
