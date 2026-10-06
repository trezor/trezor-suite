import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WrapReserveStatus } from '@suite-common/wallet-core';
import { type BoxProps } from '@suite-native/atoms';

import { FeeReserveBanner } from './FeeReserveBanner';

export type WrappedNativeFeeReserve = {
    /** Recommended reserve in display units of the native coin. */
    amount: string;
    /** The balance does not exceed the reserve, so there is nothing to wrap. */
    isInsufficient: boolean;
    wrapStatus: WrapReserveStatus;
};

type WrappedNativeFeeReserveBannerProps = BoxProps & {
    feeReserve: WrappedNativeFeeReserve | null;
    networkSymbol: NetworkSymbol;
};

export const WrappedNativeFeeReserveBanner = ({
    feeReserve,
    networkSymbol,
    ...boxProps
}: WrappedNativeFeeReserveBannerProps) => {
    const bannerProps = useMemo(() => {
        if (!feeReserve) return null;

        if (feeReserve.isInsufficient) {
            return {
                intent: 'warning',
                translationId: 'earn.wrapNativeToken.insufficientFeeReserve',
            } as const;
        }

        if (feeReserve.wrapStatus === 'kept') {
            return { intent: 'info', translationId: 'earn.wrapNativeToken.reserveKept' } as const;
        }

        if (feeReserve.wrapStatus === 'below') {
            return {
                intent: 'info',
                translationId: 'earn.wrapNativeToken.reserveRecommendation',
            } as const;
        }

        return null;
    }, [feeReserve]);

    if (!feeReserve || !bannerProps) return null;

    return (
        <FeeReserveBanner
            networkSymbol={networkSymbol}
            amount={feeReserve.amount}
            {...bannerProps}
            {...boxProps}
        />
    );
};
