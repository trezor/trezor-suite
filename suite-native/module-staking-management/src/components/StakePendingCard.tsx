import { TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { Box, Card, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    selectIsStakeConfirmingByAccountKey,
    selectIsStakePendingByAccountKey,
    selectTotalStakePendingByAccountKey,
} from '@suite-native/staking';
import { NativeStakingRootState } from '@suite-native/staking/src/types';

const stakingItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp4,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.sp8,
}));

const getCardAlertProps = (isStakeConfirming: boolean, isStakePending: boolean) => {
    if (isStakeConfirming && !isStakePending) {
        return {
            alertTitle: <Translation id="staking.stakePendingCard.transactionPending" />,
            alertVariant: 'loading',
        } as const;
    }
    if (!isStakeConfirming && isStakePending) {
        return {
            alertTitle: <Translation id="staking.stakePendingCard.addingToStakingPool" />,
            alertVariant: 'loading',
        } as const;
    }

    return {
        alertTitle: undefined,
        alertVariant: undefined,
    } as const;
};

type StakePendingCardProps = {
    accountKey: string;
    handleToggleBottomSheet: (value: boolean) => void;
};

export const StakePendingCard = ({
    accountKey,
    handleToggleBottomSheet,
}: StakePendingCardProps) => {
    const { applyStyle } = useNativeStyles();

    const networkSymbol = useSelector((state: AccountsRootState) =>
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
        () => getCardAlertProps(isStakeConfirming, isStakePending),
        [isStakeConfirming, isStakePending],
    );

    if (!networkSymbol || !cardAlertProps.alertVariant) return null;

    return (
        <TouchableOpacity onPress={() => handleToggleBottomSheet(true)}>
            <Card {...cardAlertProps}>
                <Box style={applyStyle(stakingItemStyle)}>
                    <Box flex={1} flexDirection="row" alignItems="center">
                        <Text>
                            <Translation id="staking.stakePendingCard.totalStakePending" />
                        </Text>
                    </Box>
                    <Box style={applyStyle(valuesContainerStyle)}>
                        <CryptoAmountFormatter
                            value={totalStakePending}
                            network={networkSymbol}
                            decimals={8}
                            color="textDefault"
                            variant="highlight"
                        />
                        <Box flexDirection="row">
                            <Text color="textSubdued">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={totalStakePending}
                                network={networkSymbol}
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
