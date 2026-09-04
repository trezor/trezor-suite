import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type StakeRootState,
    type TronStakeRootState,
    selectAccountNetworkSymbol,
    selectIsStakeConfirmingByAccountKey,
    selectIsStakePendingByAccountKey,
    selectTotalStakePendingByAccountKey,
    useAccountsSelector,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { type BannerInlineProps, Box, Card, PressableOpacity, Text } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type StakePendingCardProps = {
    accountKey: AccountKey;
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
): BannerInlineProps | undefined => {
    if (!symbol) return undefined;

    if (isStakeConfirming && !isStakePending) {
        return {
            title: <Translation id="earn.stakePendingCard.transactionPending" />,
            intent: 'warning',
            iconName: 'spinnerGap',
        };
    }
    if (!isStakeConfirming && isStakePending) {
        return {
            title: isSolana(symbol) ? (
                <Translation id="earn.stakePendingCard.activatingStake" />
            ) : (
                <Translation id="earn.stakePendingCard.addingToStakingPool" />
            ),
            intent: 'warning',
            iconName: 'spinnerGap',
        };
    }

    return undefined;
};

const getTitle = (symbol: NetworkSymbol) =>
    isSolana(symbol) ? (
        <Translation id="earn.stakePendingCard.totalStakeActivating" />
    ) : (
        <Translation id="earn.stakePendingCard.totalStakePending" />
    );

export const StakePendingCard = ({
    accountKey,
    handleToggleBottomSheet,
}: StakePendingCardProps) => {
    const { applyStyle } = useNativeStyles();

    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));

    const totalStakePending =
        useSelector((state: StakeRootState) =>
            selectTotalStakePendingByAccountKey(state, accountKey),
        ) ?? null;

    const isStakePending = useSelector((state: StakeRootState & TronStakeRootState) =>
        selectIsStakePendingByAccountKey(state, accountKey),
    );
    const isStakeConfirming = useSelector((state: StakeRootState & TronStakeRootState) =>
        selectIsStakeConfirmingByAccountKey(state, accountKey),
    );

    const cardAlertProps = useMemo(
        () => getCardAlertProps(symbol, isStakeConfirming, isStakePending),
        [symbol, isStakeConfirming, isStakePending],
    );

    if (!symbol || !cardAlertProps?.intent) return null;

    const title = getTitle(symbol);

    return (
        <PressableOpacity onPress={() => handleToggleBottomSheet(true)}>
            <Card alertProps={cardAlertProps}>
                <Box style={applyStyle(stakingItemStyle)}>
                    <Box flex={1} flexDirection="row" alignItems="center">
                        <Text>{title}</Text>
                    </Box>
                    <Box style={applyStyle(valuesContainerStyle)}>
                        <CompactCryptoAmountFormatter
                            value={totalStakePending}
                            symbol={symbol}
                            color="contentPrimary"
                            variant="body-md-strong"
                        />
                        <Box flexDirection="row">
                            <Text color="contentSecondary">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={totalStakePending}
                                symbol={symbol}
                                color="contentSecondary"
                                isBalance
                            />
                        </Box>
                    </Box>
                </Box>
            </Card>
        </PressableOpacity>
    );
};
