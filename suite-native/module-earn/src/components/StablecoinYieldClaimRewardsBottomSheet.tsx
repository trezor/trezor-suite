import { useCallback } from 'react';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { AccountTypeBadge } from '@suite-native/accounts';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Card,
    HStack,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { AddressFormatter, BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type StablecoinYieldClaimSummary } from '../types';

const itemCardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp16,
}));

const itemRowStyle = prepareNativeStyle(utils => ({
    minHeight: 70,
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
}));

const itemContentStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const itemValueStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: utils.spacings.sp8,
}));

type StablecoinYieldClaimRewardsItemProps = {
    claimReward: StablecoinYieldClaimSummary;
    onPress: (claimReward: StablecoinYieldClaimSummary) => void;
};

const StablecoinYieldClaimRewardsItem = ({
    claimReward,
    onPress,
}: StablecoinYieldClaimRewardsItemProps) => {
    const { applyStyle } = useNativeStyles();

    const handlePress = useCallback(() => {
        onPress(claimReward);
    }, [claimReward, onPress]);

    const title =
        claimReward.accountLabel ?? getNetworkDisplaySymbolName(claimReward.networkSymbol);

    return (
        <Card borderColor="borderNeutral" noPadding style={applyStyle(itemCardStyle)}>
            <PressableOpacity onPress={handlePress} style={applyStyle(itemRowStyle)}>
                <Box marginRight="sp12">
                    <TokenIcon symbol={claimReward.networkSymbol} size="small" />
                </Box>

                <VStack spacing="sp2" style={applyStyle(itemContentStyle)}>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                        {title}
                    </Text>
                    <AddressFormatter
                        value={claimReward.accountDescriptor}
                        format="short"
                        variant="body-sm"
                        color="contentSecondary"
                        numberOfLines={1}
                    />
                    <AccountTypeBadge accountKey={claimReward.accountKey} alignSelf="flex-start" />
                </VStack>

                <HStack alignItems="center" spacing="sp8" style={applyStyle(itemValueStyle)}>
                    <BaseCurrencyAmountFormatter
                        value={claimReward.fiatClaimableAmount}
                        variant="body-md"
                        isDiscreetText={false}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    />
                    <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
                </HStack>
            </PressableOpacity>
        </Card>
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
