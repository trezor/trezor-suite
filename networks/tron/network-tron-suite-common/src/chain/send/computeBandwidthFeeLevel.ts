import {
    TRON_BANDWIDTH_SUN_PRICE,
    TRON_CREATE_ACCOUNT_FEE_SUN,
} from '@trezor/network-tron/constants';

import type { EstimateFeeLevel } from './types';

type ComputeBandwidthFeeLevelParams = {
    availableStakedBandwidth: number;
    availableFreeBandwidth: number;
    bytes: number;
    isNewAccount?: boolean;
};

/** The TRX burned for the bandwidth a transaction needs beyond what the account has. */
export const computeBandwidthFeeLevel = ({
    availableStakedBandwidth,
    availableFreeBandwidth,
    bytes,
    isNewAccount = false,
}: ComputeBandwidthFeeLevelParams): EstimateFeeLevel => {
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
