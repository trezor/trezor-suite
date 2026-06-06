import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { AccountsListItemBase } from '@suite-native/accounts';
import { BottomSheetModal, type BottomSheetModalRef, Box, HStack } from '@suite-native/atoms';
import { AddressFormatter, BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { type StablecoinYieldClaimSummary } from '../types';

type ClaimRewardsAmountProps = {
    claimReward: StablecoinYieldClaimSummary;
};

const ClaimRewardsAmount = ({ claimReward }: ClaimRewardsAmountProps) => (
    <BaseCurrencyAmountFormatter
        value={claimReward.fiatClaimableAmount}
        variant="body-md"
        isDiscreetText={false}
        numberOfLines={1}
        adjustsFontSizeToFit
    />
);

type StablecoinYieldClaimRewardsItemProps = {
    claimReward: StablecoinYieldClaimSummary;
    onPress: (claimReward: StablecoinYieldClaimSummary) => void;
};

const StablecoinYieldClaimRewardsItem = ({
    claimReward,
    onPress,
}: StablecoinYieldClaimRewardsItemProps) => {
    const handlePress = useCallback(() => {
        onPress(claimReward);
    }, [claimReward, onPress]);

    return (
        <AccountsListItemBase
            hasBackground
            isFirst
            isLast
            icon={<CryptoIcon symbol={claimReward.networkSymbol} />}
            title={
                claimReward.accountLabel ?? getNetworkDisplaySymbolName(claimReward.networkSymbol)
            }
            secondaryTitle={
                <AddressFormatter
                    value={claimReward.accountDescriptor}
                    format="short"
                    variant="body-sm"
                    color="contentSecondary"
                    numberOfLines={1}
                />
            }
            mainValue={
                <HStack alignItems="center" spacing="sp8">
                    <ClaimRewardsAmount claimReward={claimReward} />
                    <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
                </HStack>
            }
            secondaryValue={null}
            onPress={handlePress}
        />
    );
};

type StablecoinYieldClaimRewardsBottomSheetProps = {
    ref: BottomSheetModalRef;
    claimRewards: StablecoinYieldClaimSummary[];
    onClose: () => void;
};

export const StablecoinYieldClaimRewardsBottomSheet = ({
    ref,
    claimRewards,
    onClose,
}: StablecoinYieldClaimRewardsBottomSheetProps) => {
    const handleClaimRewardsSelect = useCallback(
        ({ accountKey }: StablecoinYieldClaimSummary) => {
            onClose();
            // TODO: Navigate to YieldClaim once the Stablecoin Yield claim screen is implemented.
            void accountKey;
        },
        [onClose],
    );

    const renderItem = useCallback(
        ({ item }: { item: StablecoinYieldClaimSummary }) => (
            <StablecoinYieldClaimRewardsItem
                claimReward={item}
                onPress={handleClaimRewardsSelect}
            />
        ),
        [handleClaimRewardsSelect],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.earnScreen.claimRewards.title" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <Box paddingTop="sp16">
                <FlashList
                    data={claimRewards}
                    keyExtractor={item => item.accountKey}
                    renderItem={renderItem}
                />
            </Box>
        </BottomSheetModal>
    );
};
