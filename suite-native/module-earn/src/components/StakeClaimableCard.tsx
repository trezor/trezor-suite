import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Box, Card, PressableOpacity, Text } from '@suite-native/atoms';
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

    const handlePress = useCallback(() => {
        if (!symbol) {
            return;
        }
        navigation.navigate(RootStackRoutes.ClaimReview, { accountKey, symbol });
    }, [accountKey, navigation, symbol]);

    if (!symbol || !isPositiveBalance(claimableAmount)) {
        return null;
    }

    return (
        <PressableOpacity onPress={handlePress}>
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
                            color="textDefault"
                            variant="body-md-strong"
                        />
                        <Box flexDirection="row">
                            <Text color="textSubdued">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={claimableAmount}
                                symbol={symbol}
                                color="textSubdued"
                                isBalance
                            />
                        </Box>
                    </Box>
                </Box>
            </Card>
        </PressableOpacity>
    );
};
