import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { parseAccountKey } from '@suite-common/wallet-utils';
import { AccountTypeBadge, selectAccountLabel } from '@suite-native/accounts';
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
import { type CombinedLabelingState } from '@suite-native/labeling';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type StablecoinYieldClaimItem } from '../utils/stablecoinYieldClaimSummaryUtils';

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
    claimItem: StablecoinYieldClaimItem;
    onPress: (claimItem: StablecoinYieldClaimItem) => void;
};

const StablecoinYieldClaimRewardsItem = ({
    claimItem,
    onPress,
}: StablecoinYieldClaimRewardsItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { summary, vaults } = claimItem;

    const { accountDescriptor, deviceStaticSessionId } = parseAccountKey(summary.accountKey);
    const customAccountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, deviceStaticSessionId, accountDescriptor, summary.networkSymbol),
    );

    const handlePress = useCallback(() => {
        onPress(claimItem);
    }, [claimItem, onPress]);

    const accountTitle = customAccountLabel ?? getNetworkDisplaySymbolName(summary.networkSymbol);
    const hasVaults = vaults.length > 0;
    const singleVault = vaults.length === 1 ? vaults[0] : undefined;
    const vaultsTitle = vaults.map(vault => vault.name).join(', ');

    return (
        <Card borderColor="borderNeutral" noPadding style={applyStyle(itemCardStyle)}>
            <PressableOpacity onPress={handlePress} style={applyStyle(itemRowStyle)}>
                <Box marginRight="sp12">
                    <TokenIcon
                        symbol={summary.networkSymbol}
                        contractAddress={singleVault?.tokenContract}
                        size="small"
                        showNetworkIcon={!!singleVault}
                        wrappedTokenIcon="network"
                    />
                </Box>

                <VStack spacing="sp2" style={applyStyle(itemContentStyle)}>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                        {hasVaults ? vaultsTitle : accountTitle}
                    </Text>
                    {hasVaults ? (
                        <Text
                            variant="body-sm"
                            color="contentSecondary"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {accountTitle}
                        </Text>
                    ) : (
                        <AddressFormatter
                            value={accountDescriptor}
                            format="short"
                            variant="body-sm"
                            color="contentSecondary"
                            numberOfLines={1}
                        />
                    )}
                    <AccountTypeBadge accountKey={summary.accountKey} alignSelf="flex-start" />
                </VStack>

                <HStack alignItems="center" spacing="sp8" style={applyStyle(itemValueStyle)}>
                    <BaseCurrencyAmountFormatter
                        value={summary.fiatClaimableAmount}
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
    claimItems: StablecoinYieldClaimItem[];
    onClaimRewardPress: (claimItem: StablecoinYieldClaimItem) => void;
    onClose: () => void;
};

export const StablecoinYieldClaimRewardsBottomSheet = ({
    ref,
    claimItems,
    onClaimRewardPress,
    onClose,
}: StablecoinYieldClaimRewardsBottomSheetProps) => {
    const handleClaimRewardsSelect = useCallback(
        (claimItem: StablecoinYieldClaimItem) => {
            onClose();
            onClaimRewardPress(claimItem);
        },
        [onClaimRewardPress, onClose],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.earnScreen.activeSheet.stablecoinYieldTitle" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <Box paddingTop="sp16">
                {claimItems.map(claimItem => (
                    <StablecoinYieldClaimRewardsItem
                        key={claimItem.summary.accountKey}
                        claimItem={claimItem}
                        onPress={handleClaimRewardsSelect}
                    />
                ))}
            </Box>
        </BottomSheetModal>
    );
};
