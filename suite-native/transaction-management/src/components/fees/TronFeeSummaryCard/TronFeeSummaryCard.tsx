import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type FeesRootState,
    selectAccountByKey,
    selectAreFeesLoading,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { calculateTronFeeBreakdown } from '@suite-common/wallet-utils';
import { AnimatedPressable } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { TronFeeSummaryCardContent } from './TronFeeSummaryCardContent';
import { selectFeeLevels } from '../../../selectors';
import { type NativeSendRootState } from '../../../sendFormSlice';

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
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, account?.symbol),
    );
    const { translate } = useTranslate();

    if (!account || account.networkType !== 'tron') return null;

    const breakdown = calculateTronFeeBreakdown(
        feeLevels.normal,
        account.misc?.tronResources,
        account.symbol,
        feeLimitSunOverride,
    );

    const trxBurned =
        breakdown !== null && !breakdown.trxBurned.isZero() ? breakdown.trxBurned.toString() : null;

    const resourceParts: string[] = [];
    if (breakdown?.coveredEnergy.gt(0)) {
        resourceParts.push(
            translate('moduleSend.fees.tron.energyCount', {
                count: breakdown.coveredEnergy.toFixed(0),
            }),
        );
    }
    if (breakdown?.coveredBandwidth.gt(0)) {
        resourceParts.push(
            translate('moduleSend.fees.tron.bandwidthCount', {
                count: breakdown.coveredBandwidth.toFixed(0),
            }),
        );
    }
    const resourceLabel = resourceParts.join(' & ');

    const content = (
        <TronFeeSummaryCardContent
            symbol={account.symbol}
            networkType={account.networkType}
            supportsAdjustableFees={supportsAdjustableFees}
            trxBurned={trxBurned}
            areFeesLoading={areFeesLoading}
            resourceLabel={resourceLabel}
        />
    );

    if (onPress) {
        return (
            <AnimatedPressable
                exiting={FadeOut}
                entering={FadeIn}
                onPress={onPress}
                testID={testID}
            >
                {content}
            </AnimatedPressable>
        );
    }

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut} testID={testID}>
            {content}
        </Animated.View>
    );
};
