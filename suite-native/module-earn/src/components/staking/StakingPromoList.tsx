import React, { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/networks';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Card, CardDivider, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { StakingDesktopOnlyBottomSheet } from './StakingDesktopOnlyBottomSheet';
import { StakingPromoListItem } from './StakingPromoListItem';
import { StakingPromoListProvider } from './StakingPromoListProvider';
import { useMessageSystemEarnDashboard } from '../../hooks/earn/useMessageSystemEarnDashboard';
import { useStakingPromoList } from '../../hooks/staking/useStakingPromoList';
import { useStakingPromoNavigation } from '../../hooks/staking/useStakingPromoNavigation';
import { EarnEnableNetworkBottomSheet } from '../earn/EarnEnableNetworkBottomSheet';
import { EarnPromoDisabledBanner } from '../earn/EarnPromoDisabledBanner';
import { EarnSelectAccountBottomSheet } from '../earn/EarnSelectAccountBottomSheet';

const StakingPromoListHeader = () => (
    <HStack alignItems="center" spacing="sp8" paddingHorizontal="sp16" paddingVertical="sp8">
        <Icon name="piggyBank" color="contentSecondary" size="mediumLarge" />
        <Text variant="body-md" color="contentSecondary">
            <Translation id="earn.staking" />
        </Text>
    </HStack>
);

export const StakingPromoList = () => {
    const { analytics } = useServices(injectNativeAnalytics);
    const { isDisabled } = useMessageSystemEarnDashboard('staking');

    const { stakingSymbols } = useStakingPromoList();

    const {
        selectAccountSheetRef,
        closeSelectAccountSheet,
        onSelectAccountDismiss,
        onAccountPress,
        enableNetworkSheetRef,
        onEnableNetworkPress,
        onEnableNetworkDismiss,
        infoSheetRef,
        chosenAccounts,
        pendingEnableSymbol,
        onPromoItemPress,
    } = useStakingPromoNavigation();

    const onItemPress = useCallback(
        (symbol: NetworkSymbol) => {
            analytics.report({ type: events.earnStakeTilePressedEvent.name });
            onPromoItemPress(symbol);
        },
        [analytics, onPromoItemPress],
    );

    return (
        <>
            <VStack spacing="sp24">
                <Card noPadding borderColor="borderNeutral">
                    <StakingPromoListHeader />

                    {isDisabled ? (
                        <EarnPromoDisabledBanner type="staking" />
                    ) : (
                        <>
                            {stakingSymbols.map(symbol => (
                                <React.Fragment key={symbol}>
                                    <CardDivider horizontalPadding={0} />
                                    <StakingPromoListItem
                                        key={symbol}
                                        symbol={symbol}
                                        onPress={onItemPress}
                                    />
                                </React.Fragment>
                            ))}
                        </>
                    )}
                </Card>

                <StakingPromoListProvider />
            </VStack>

            <EarnSelectAccountBottomSheet
                type="staking"
                ref={selectAccountSheetRef}
                accounts={chosenAccounts}
                onAccountPress={onAccountPress}
                onClose={closeSelectAccountSheet}
                onDismiss={onSelectAccountDismiss}
            />

            <EarnEnableNetworkBottomSheet
                type="staking"
                ref={enableNetworkSheetRef}
                symbol={pendingEnableSymbol}
                onEnablePress={onEnableNetworkPress}
                onDismiss={onEnableNetworkDismiss}
            />

            <StakingDesktopOnlyBottomSheet ref={infoSheetRef} />
        </>
    );
};
