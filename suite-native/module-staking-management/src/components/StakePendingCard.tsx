import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { Box, Card, InlineAlertBoxProps, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    selectIsStakeConfirmingByAccountKey,
    selectIsStakePendingByAccountKey,
    selectTotalStakePendingByAccountKey,
} from '@suite-native/staking';
import { NativeStakingRootState } from '@suite-native/staking/src/types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type StakePendingCardProps = {
    accountKey: string;
    handleToggleBottomSheet: (value: boolean) => void;
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

const isSolana = (symbol: NetworkSymbol) => ['sol', 'dsol'].includes(symbol);

const getCardAlertProps = (
    symbol: NetworkSymbol | null,
    isStakeConfirming: boolean,
    isStakePending: boolean,
): InlineAlertBoxProps | undefined => {
    if (!symbol) return undefined;

    if (isStakeConfirming && !isStakePending) {
        return {
            title: <Translation id="staking.stakePendingCard.transactionPending" />,
            variant: 'warning',
            iconName: 'spinnerGap',
        };
    }
    if (!isStakeConfirming && isStakePending) {
        return {
            title: isSolana(symbol) ? (
                <Translation id="staking.stakePendingCard.activatingStake" />
            ) : (
                <Translation id="staking.stakePendingCard.addingToStakingPool" />
            ),
            variant: 'warning',
            iconName: 'spinnerGap',
        };
    }

    return undefined;
};

const getTitle = (symbol: NetworkSymbol) =>
    isSolana(symbol) ? (
        <Translation id="staking.stakePendingCard.totalStakeActivating" />
    ) : (
        <Translation id="staking.stakePendingCard.totalStakePending" />
    );

export const StakePendingCard = ({
    accountKey,
    handleToggleBottomSheet,
}: StakePendingCardProps) => {
    const { applyStyle } = useNativeStyles();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const totalStakePending = useSelector((state: NativeStakingRootState) =>
        selectTotalStakePendingByAccountKey(state, accountKey),
    );

    const isStakePending = useSelector((state: NativeStakingRootState) =>
        selectIsStakePendingByAccountKey(state, accountKey),
    );
    const isStakeConfirming = useSelector((state: NativeStakingRootState) =>
        selectIsStakeConfirmingByAccountKey(state, accountKey),
    );

    const cardAlertProps = useMemo(
        () => getCardAlertProps(symbol, isStakeConfirming, isStakePending),
        [symbol, isStakeConfirming, isStakePending],
    );

    if (!symbol || !cardAlertProps?.variant) return null;

    const title = getTitle(symbol);

    return (
        <TouchableOpacity onPress={() => handleToggleBottomSheet(true)}>
            <Card alertProps={cardAlertProps}>
                <Box style={applyStyle(stakingItemStyle)}>
                    <Box flex={1} flexDirection="row" alignItems="center">
                        <Text>{title}</Text>
                    </Box>
                    <Box style={applyStyle(valuesContainerStyle)}>
                        <CryptoAmountFormatter
                            value={totalStakePending}
                            symbol={symbol}
                            decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                            color="textDefault"
                            variant="highlight"
                        />
                        <Box flexDirection="row">
                            <Text color="textSubdued">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={totalStakePending}
                                symbol={symbol}
                                color="textSubdued"
                                isBalance
                            />
                        </Box>
                    </Box>
                </Box>
            </Card>
        </TouchableOpacity>
    );
};
