import React, { useCallback, useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { Card, CardDivider, HStack, ListItemSkeleton, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { YieldLoadErrorAlert } from './YieldLoadErrorAlert';
import { YieldPromoListItem } from './YieldPromoListItem';
import { YieldPromoListProvider } from './YieldPromoListProvider';
import { useMessageSystemEarnDashboard } from '../../hooks/earn/useMessageSystemEarnDashboard';
import { useYieldPromoList } from '../../hooks/yield/useYieldPromoList';
import { useYieldPromoNavigation } from '../../hooks/yield/useYieldPromoNavigation';
import { type YieldPromoListItem as YieldPromoListItemType } from '../../types';
import { EarnEnableNetworkBottomSheet } from '../earn/EarnEnableNetworkBottomSheet';
import { EarnPromoDisabledBanner } from '../earn/EarnPromoDisabledBanner';
import { EarnSelectAccountBottomSheet } from '../earn/EarnSelectAccountBottomSheet';

const SKELETON_ROW_COUNT = 3;

const YieldPromoListSkeleton = () => (
    <>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <React.Fragment key={index}>
                <CardDivider horizontalPadding={0} />
                <ListItemSkeleton />
            </React.Fragment>
        ))}
    </>
);

const YieldPromoListHeader = () => (
    <HStack alignItems="center" spacing="sp8" paddingHorizontal="sp16" paddingVertical="sp8">
        <Icon name="coins" color="contentSecondary" size="mediumLarge" />
        <Text variant="body-md" color="contentSecondary">
            <Translation id="earn.defiYield" />
        </Text>
    </HStack>
);

export const YieldPromoList = () => {
    const { analytics } = useServices(injectNativeAnalytics);
    const { isDisabled } = useMessageSystemEarnDashboard('yield');

    const { vaults, isLoading, isError, refetch } = useYieldPromoList();

    const {
        selectAccountSheetRef,
        closeSelectAccountSheet,
        onSelectAccountDismiss,
        onAccountPress,
        selectAccountTokenBalance,
        enableNetworkSheetRef,
        onEnableNetworkPress,
        onEnableNetworkDismiss,
        chosenAccounts,
        pendingEnableSymbol,
        onPromoItemPress,
    } = useYieldPromoNavigation();

    const onItemPress = useCallback(
        (item: YieldPromoListItemType) => {
            analytics.report({ type: events.earnStablecoinYieldTilePressedEvent.name });
            onPromoItemPress(item);
        },
        [analytics, onPromoItemPress],
    );

    const onRetry = useCallback(() => {
        void refetch();
    }, [refetch]);

    const content = useMemo(() => {
        if (isDisabled) {
            return <EarnPromoDisabledBanner type="yield" />;
        }

        if (isLoading) {
            return <YieldPromoListSkeleton />;
        }

        if (isError) {
            return (
                <>
                    <CardDivider horizontalPadding={0} />
                    <YieldLoadErrorAlert onRetry={onRetry} />
                </>
            );
        }

        return vaults.map(item => (
            <React.Fragment key={item.id}>
                <CardDivider horizontalPadding={0} />
                <YieldPromoListItem item={item} onPress={onItemPress} />
            </React.Fragment>
        ));
    }, [vaults, isDisabled, isLoading, isError, onItemPress, onRetry]);

    const isProviderDisplayed = !isDisabled && !isLoading && !isError && vaults.length > 0;

    return (
        <>
            <VStack spacing="sp24">
                <Card noPadding borderColor="borderNeutral">
                    <YieldPromoListHeader />

                    {content}
                </Card>

                {isProviderDisplayed && <YieldPromoListProvider />}
            </VStack>

            <EarnSelectAccountBottomSheet
                type="yield"
                ref={selectAccountSheetRef}
                accounts={chosenAccounts}
                onAccountPress={onAccountPress}
                onClose={closeSelectAccountSheet}
                onDismiss={onSelectAccountDismiss}
                tokenBalance={selectAccountTokenBalance}
            />

            <EarnEnableNetworkBottomSheet
                type="yield"
                ref={enableNetworkSheetRef}
                symbol={pendingEnableSymbol}
                onEnablePress={onEnableNetworkPress}
                onDismiss={onEnableNetworkDismiss}
            />
        </>
    );
};
