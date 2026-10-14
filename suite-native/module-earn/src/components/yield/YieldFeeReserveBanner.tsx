import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type BoxProps } from '@suite-native/atoms';

import { type YieldFeeReserveAlert } from '../../utils/yield/yieldFeeReserveUtils';
import { FeeReserveBanner } from '../earn/FeeReserveBanner';

type YieldFeeReserveBannerProps = BoxProps & {
    alert: YieldFeeReserveAlert | null;
    networkSymbol: NetworkSymbol;
};

export const YieldFeeReserveBanner = ({
    alert,
    networkSymbol,
    ...boxProps
}: YieldFeeReserveBannerProps) => {
    const bannerProps = useMemo(() => {
        if (!alert) return null;

        switch (alert?.type) {
            case 'insufficient':
                return {
                    intent: 'warning',
                    translationId:
                        'earn.yieldDepositFlowScreen.alerts.insufficientFeeReserve.title',
                } as const;
            case 'top-up':
                return {
                    intent: 'info',
                    translationId: 'earn.yieldDepositFlowScreen.alerts.feeReserveTopUp.title',
                } as const;
        }
    }, [alert]);

    if (!alert || !bannerProps) return null;

    return (
        <FeeReserveBanner
            networkSymbol={networkSymbol}
            amount={alert.amount}
            {...bannerProps}
            {...boxProps}
        />
    );
};
