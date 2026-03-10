import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS, useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    NativeStakingRootState,
    selectClaimableAmountByAccountKey,
    useSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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
    const { CryptoAmountFormatter: amountFormatter } = useFormatters();

    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));
    const claimableAmount = useSelector((state: NativeStakingRootState) =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );

    if (!symbol || !claimableAmount) return null;

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
                                symbol: getNetworkDisplaySymbol(symbol),
                            }}
                        />
                    </Text>
                    <Button colorScheme="primary" size="small" isFullWidth>
                        <Text variant="body-sm-strong" color="textOnPrimary">
                            <Translation id="earn.stakingManagementScreen.claim.claimButton" />
                        </Text>
                    </Button>
                </VStack>
            </HStack>
        </Box>
    );
};
