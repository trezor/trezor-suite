import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS, useFormatters } from '@suite-common/formatters';
import { selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    type NativeStakingRootState,
    selectClaimableAmountByAccountKey,
    useSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

type StakingManagementReadyToClaimCardProps = {
    accountKey: AccountKey;
};

const containerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundPrimarySubtleOnElevation1,
    borderRadius: utils.borders.radii.r12,
    padding: utils.spacings.sp16,
}));

export const StakingManagementReadyToClaimCard = ({
    accountKey,
}: StakingManagementReadyToClaimCardProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const { CryptoAmountFormatter: amountFormatter } = useFormatters();

    const symbol = useSelector((state: NativeStakingRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const claimableAmount = useSelector((state: NativeStakingRootState) =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );

    const handleClaimPress = useCallback(() => {
        if (!symbol) {
            return;
        }
        navigation.navigate(RootStackRoutes.ClaimReview, { accountKey, symbol });
    }, [accountKey, navigation, symbol]);

    if (!symbol || !isPositiveBalance(claimableAmount)) {
        return null;
    }

    const formattedAmount = amountFormatter.format(claimableAmount, {
        isBalance: true,
        maxDisplayedDecimals: BASE_CRYPTO_MAX_DISPLAYED_DECIMALS,
        symbol,
        isEllipsisAppended: false,
    });

    return (
        <Box style={applyStyle(containerStyle)}>
            <HStack spacing="sp12">
                <Icon name="checkCircle" size="large" color="iconDefault" />
                <VStack flex={1} spacing="sp12">
                    <Text variant="body-md">
                        <Translation
                            id="earn.stakingManagementScreen.claim.readyToClaim"
                            values={{
                                amount: formattedAmount,
                            }}
                        />
                    </Text>
                    <Button size="medium" isFullWidth onPress={handleClaimPress}>
                        <Text variant="body-sm-strong" color="textOnPrimary">
                            <Translation id="earn.stakingManagementScreen.claim.claimButton" />
                        </Text>
                    </Button>
                </VStack>
            </HStack>
        </Box>
    );
};
