import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Box, Card, InlineAlertBox, PressableOpacity, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    selectClaimableAmountByAccountKey,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useMessageSystemStaking } from '../hooks/useMessageSystemStaking';

type StakeClaimableCardProps = {
    accountKey: AccountKey;
};

const stakingItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp4,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '45%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.sp8,
}));

export const StakeClaimableCard = ({ accountKey }: StakeClaimableCardProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.StakingDetail>>();

    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));

    const claimableAmount = useNativeStakingSelector(state =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );

    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(symbol);

    const handlePress = useCallback(() => {
        if (!symbol || isClaimingDisabled) {
            return;
        }
        navigation.navigate(RootStackRoutes.ClaimReview, { accountKey, symbol });
    }, [accountKey, navigation, symbol, isClaimingDisabled]);

    if (!symbol || !isPositiveBalance(claimableAmount)) {
        return null;
    }

    return (
        <PressableOpacity onPress={handlePress} disabled={isClaimingDisabled}>
            <Card>
                <Box style={applyStyle(stakingItemStyle)}>
                    <Box flex={1}>
                        <Text>
                            <Translation id="earn.claimableCard.claimable" />
                        </Text>
                    </Box>
                    <Box style={applyStyle(valuesContainerStyle)}>
                        <CryptoAmountFormatter
                            value={claimableAmount}
                            symbol={symbol}
                            decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                            color="contentPrimary"
                            variant="body-md-strong"
                        />
                        <Box flexDirection="row">
                            <Text color="contentSecondary">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={claimableAmount}
                                symbol={symbol}
                                color="contentSecondary"
                                isBalance
                            />
                        </Box>
                    </Box>
                </Box>
                {isClaimingDisabled && claimingMessageContent && (
                    <InlineAlertBox variant="warning" title={claimingMessageContent} />
                )}
            </Card>
        </PressableOpacity>
    );
};
