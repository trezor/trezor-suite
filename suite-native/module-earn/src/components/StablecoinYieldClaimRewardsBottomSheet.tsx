import { useCallback } from 'react';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { AccountsListItemBase } from '@suite-native/accounts';
import { BottomSheetModal, type BottomSheetModalRef, Box, HStack } from '@suite-native/atoms';
import { AddressFormatter, BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { type StablecoinYieldClaimSummary } from '../types';

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
                    <BaseCurrencyAmountFormatter
                        value={claimReward.fiatClaimableAmount}
                        variant="body-md"
                        isDiscreetText={false}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    />
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
    onClaimRewardPress: (claimReward: StablecoinYieldClaimSummary) => void;
    onClose: () => void;
};

export const StablecoinYieldClaimRewardsBottomSheet = ({
    ref,
    claimRewards,
    onClaimRewardPress,
    onClose,
}: StablecoinYieldClaimRewardsBottomSheetProps) => {
    const handleClaimRewardsSelect = useCallback(
        (claimReward: StablecoinYieldClaimSummary) => {
            onClose();
            onClaimRewardPress(claimReward);
        },
        [onClaimRewardPress, onClose],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.earnScreen.claimRewards.title" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <Box paddingTop="sp16">
                {claimRewards.map(claimReward => (
                    <StablecoinYieldClaimRewardsItem
                        key={claimReward.accountKey}
                        claimReward={claimReward}
                        onPress={handleClaimRewardsSelect}
                    />
                ))}
            </Box>
        </BottomSheetModal>
    );
};
