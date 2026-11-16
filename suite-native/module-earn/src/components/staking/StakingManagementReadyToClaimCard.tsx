import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type StakingAccountProductRootState,
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountProductDescriptor,
    selectStakingAccountTotals,
    useStakingAccess,
} from '@suite-common/earn-staking';
import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS, useFormatters } from '@suite-common/formatters';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance, parseAccountKey } from '@suite-common/wallet-utils';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { BannerInline, Box, Button, Discreet, HStack, Text, VStack } from '@suite-native/atoms';
import { useStakingOperationMessage } from '@suite-native/earn';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useEarnPortfolioTrackerGuard } from '../earn/EarnPortfolioTrackerGuard';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

type StakingManagementReadyToClaimCardProps = {
    accountKey: AccountKey;
};

const containerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillBrandSoft,
    borderRadius: utils.borders.radii.r12,
    padding: utils.spacings.sp16,
}));

export const StakingManagementReadyToClaimCard = ({
    accountKey,
}: StakingManagementReadyToClaimCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { isPortfolioTrackerDevice, openPortfolioTrackerSheet } = useEarnPortfolioTrackerGuard();
    const navigation = useNavigation<NavigationProp>();
    const { CryptoAmountFormatter } = useFormatters();
    const { analytics } = useServices(injectNativeAnalytics);
    const { networkSymbol: symbol } = parseAccountKey(accountKey);

    const productId = useSelector(
        (state: StakingAccountProductRootState) =>
            selectStakingAccountProductDescriptor(state, accountKey)?.id ?? null,
    );
    const totals = useSelector((state: StakingRootState) =>
        selectStakingAccountTotals(state, accountKey),
    );
    const access = useStakingAccess(productId);
    const withdrawMessage = useStakingOperationMessage(productId, 'withdraw');

    const withdrawableAmount = formatStakingAmount({
        amount: totals.withdrawable,
        networkSymbol: symbol,
    });
    const isWithdrawDisabled = access.disabled.withdraw !== undefined;

    const onClaimPress = () => {
        if (isPortfolioTrackerDevice) {
            openPortfolioTrackerSheet();

            return;
        }

        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: symbol,
            },
        });
        navigation.navigate(RootStackRoutes.StakingClaimReview, { accountKey, symbol });
    };

    if (!isPositiveBalance(withdrawableAmount)) {
        return null;
    }

    return (
        <Box style={applyStyle(containerStyle)}>
            <HStack spacing="sp12">
                <Icon name="checkCircle" size="large" color="contentPrimary" />
                <VStack flex={1} spacing="sp12">
                    <Discreet>
                        <Text variant="body-md">
                            <Translation
                                id="earn.stakingManagementScreen.claim.readyToClaim"
                                values={{
                                    amount: (
                                        <CryptoAmountFormatter
                                            value={withdrawableAmount}
                                            isBalance
                                            maxDisplayedDecimals={
                                                BASE_CRYPTO_MAX_DISPLAYED_DECIMALS
                                            }
                                            symbol={symbol}
                                            isEllipsisAppended={false}
                                        />
                                    ),
                                }}
                            />
                        </Text>
                    </Discreet>

                    {isWithdrawDisabled && withdrawMessage !== null && (
                        <BannerInline intent="warning" title={withdrawMessage} />
                    )}

                    <Button
                        size="medium"
                        isFullWidth
                        onPress={onClaimPress}
                        isDisabled={isWithdrawDisabled}
                    >
                        <Text variant="body-sm-strong" color="contentButtonBrandPrimary">
                            <Translation id="earn.stakingManagementScreen.claim.claimButton" />
                        </Text>
                    </Button>
                </VStack>
            </HStack>
        </Box>
    );
};
