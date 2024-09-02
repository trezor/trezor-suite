import { TouchableOpacity } from 'react-native';

import { Box, RoundedIcon, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    getAccountTotalStakingBalanceWei,
} from '@suite-common/wallet-utils';
import { Translation } from '@suite-native/intl';

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.small,
}));

const stakingItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: utils.spacings.medium,
}));

type StakingItemProps = {
    account: Account;
};

export const StakingItem = ({ account }: StakingItemProps) => {
    const { applyStyle } = useNativeStyles();

    const stakingBalanceFormatted = getAccountTotalStakingBalance(account);
    const stakingBalance = getAccountTotalStakingBalanceWei(account);
    const networkSymbol = account?.symbol;

    return (
        <TouchableOpacity>
            <Box style={applyStyle(stakingItemStyle)}>
                <Box flex={1} flexDirection="row" alignItems="center">
                    <Box marginRight="medium">
                        <RoundedIcon name="staking" color="iconSubdued" />
                    </Box>
                    <Text variant="callout" color="textSubdued">
                        <Translation id="accountList.staking" />
                    </Text>
                </Box>
                <Box style={applyStyle(valuesContainerStyle)}>
                    <CryptoToFiatAmountFormatter value={stakingBalance} network={networkSymbol} />
                    <CryptoAmountFormatter
                        value={stakingBalanceFormatted}
                        network={networkSymbol}
                        decimals={8}
                    />
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
