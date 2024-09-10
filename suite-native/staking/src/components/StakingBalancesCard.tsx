import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { Icon } from '@suite-common/icons';
import {
    AccountsRootState,
    selectAccountNetworkSymbol,
    StakeRootState,
} from '@suite-common/wallet-core';
import { Box, Card, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import {
    getAPYByAccountKey,
    getRewardsBalanceByAccountKey,
    getStakedBalanceByAccountKey,
} from '../selectors';

const stakingItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.extraSmall,
    paddingBottom: utils.spacings.small,
}));

const stakingCardStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.medium,
}));

const stakingWrapperStyle = prepareNativeStyle(utils => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingBottom: utils.spacings.medium,
}));

const separatorStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: 1,
    borderBottomColor: utils.colors.borderElevation1,
}));

type StakingBalancesCardProps = {
    accountKey: string;
    handleToggleBottomSheet: (value: boolean) => void;
};

export const StakingBalancesCard = ({
    accountKey,
    handleToggleBottomSheet,
}: StakingBalancesCardProps) => {
    const { applyStyle } = useNativeStyles();

    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const apy = useSelector((state: StakeRootState & AccountsRootState) =>
        getAPYByAccountKey(state, accountKey),
    );

    const stakedBalance = useSelector((state: AccountsRootState) =>
        getStakedBalanceByAccountKey(state, accountKey),
    );
    const rewardsBalance = useSelector((state: AccountsRootState) =>
        getRewardsBalanceByAccountKey(state, accountKey),
    );

    if (!networkSymbol) return null;

    return (
        <TouchableOpacity onPress={() => handleToggleBottomSheet(true)}>
            <Card style={applyStyle(stakingCardStyle)}>
                <Box style={applyStyle(stakingWrapperStyle)}>
                    <Box flex={1}>
                        <Box style={applyStyle(stakingItemStyle)}>
                            <Icon name="lock" color="textSubdued" size="medium" />
                            <Text color="textSubdued" variant="label">
                                <Translation id="staking.staked" />
                            </Text>
                        </Box>
                        <CryptoAmountFormatter
                            value={stakedBalance}
                            network={networkSymbol}
                            decimals={5}
                            color="textDefault"
                            variant="titleSmall"
                        />
                        <Box flexDirection="row">
                            <Text color="textSubdued">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={stakedBalance}
                                network={networkSymbol}
                                color="textSubdued"
                            />
                        </Box>
                    </Box>
                    <Box flex={1}>
                        <Box style={applyStyle(stakingItemStyle)}>
                            <Icon name="plusCircle" color="textSubdued" size="medium" />
                            <Text color="textSubdued" variant="label">
                                <Translation id="staking.rewards" />
                            </Text>
                        </Box>
                        <CryptoAmountFormatter
                            value={rewardsBalance}
                            network={networkSymbol}
                            decimals={5}
                            color="textSecondaryHighlight"
                            variant="titleSmall"
                        />
                        <Box flexDirection="row">
                            <Text color="textSubdued">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={rewardsBalance}
                                network={networkSymbol}
                                color="textSubdued"
                            />
                        </Box>
                    </Box>
                </Box>
                <Box style={applyStyle(separatorStyle)} />

                <Box
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    paddingTop="medium"
                >
                    <Text color="textSubdued">
                        <Translation id="staking.apy" />
                    </Text>
                    <Text>{apy}%</Text>
                </Box>
            </Card>
        </TouchableOpacity>
    );
};
