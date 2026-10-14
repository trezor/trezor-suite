import { type YieldGasReserve, type YieldNativeFeeStatus } from '@suite-common/wallet-core';
import { exhaustive } from '@trezor/type-utils';

export type YieldFeeReserveAlert = {
    type: 'insufficient' | 'top-up';
    amount: string;
};

type GetYieldFeeReserveAlertParams = {
    nativeFeeStatus: YieldNativeFeeStatus;
    gasReserve: YieldGasReserve;
};

export const getYieldFeeReserveAlert = ({
    nativeFeeStatus,
    gasReserve,
}: GetYieldFeeReserveAlertParams): YieldFeeReserveAlert | null => {
    switch (nativeFeeStatus) {
        case 'insufficient':
            return { type: 'insufficient', amount: gasReserve.minimum };
        case 'below-recommended':
            return { type: 'top-up', amount: gasReserve.recommended };
        case 'sufficient':
            return null;
        default:
            return exhaustive(nativeFeeStatus);
    }
};
