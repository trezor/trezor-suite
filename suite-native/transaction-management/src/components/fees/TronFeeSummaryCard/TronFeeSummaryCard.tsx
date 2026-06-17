import { Platform } from 'react-native';
import { FadeIn, FadeOut, StretchInY, StretchOutY } from 'react-native-reanimated';

import { type AccountKey } from '@suite-common/wallet-types';
import { AnimatedPressable, Card } from '@suite-native/atoms';

import { TronFeeSummaryRow } from './TronFeeSummaryRow';
import { useTronFeeBreakdown } from '../../../hooks/fees/useTronFeeBreakdown';

type TronFeeSummaryCardProps = {
    accountKey: AccountKey;
    onPress?: () => void;
    testID?: string;
    feeLimitSunOverride?: string;
    supportsAdjustableFees: boolean;
};

export const TronFeeSummaryCard = ({
    accountKey,
    onPress,
    testID,
    feeLimitSunOverride,
    supportsAdjustableFees,
}: TronFeeSummaryCardProps) => {
    const breakdown = useTronFeeBreakdown({ accountKey, feeLimitSunOverride });

    if (!breakdown) return null;

    const summaryRow = (
        <TronFeeSummaryRow
            symbol={breakdown.symbol}
            networkType={breakdown.networkType}
            supportsAdjustableFees={supportsAdjustableFees}
            trxBurned={breakdown.trxBurned}
            areFeesLoading={breakdown.areFeesLoading}
            resourceLabel={breakdown.resourceLabel}
        />
    );

    if (onPress) {
        return (
            <AnimatedPressable
                entering={Platform.OS === 'android' ? StretchInY : FadeIn}
                exiting={Platform.OS === 'android' ? StretchOutY : FadeOut}
                onPress={onPress}
                testID={testID}
            >
                <Card noPadding>{summaryRow}</Card>
            </AnimatedPressable>
        );
    }

    return (
        <Card noPadding testID={testID}>
            {summaryRow}
        </Card>
    );
};
