import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { Box, RoundedIcon, Text } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { selectEthereumAccountTokenSymbol } from '@suite-native/ethereum-tokens';
import { AccountsRootState } from '@suite-common/wallet-core';

import { accountDescriptionStyle, valuesContainerStyle } from './AccountListItem';

type TokenListItemProps = {
    balance?: string;
    label: string;
    accountKey: AccountKey;
    contract: TokenAddress;
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
};

const horizontalLine = prepareNativeStyle(utils => ({
    height: utils.spacings.m,
    borderLeftColor: utils.colors.borderDashed,
    borderLeftWidth: 1,
    marginVertical: utils.spacings.xs,
    marginLeft: utils.spacings.large,
}));

export const TokenListItem = ({
    contract,
    balance,
    label,
    accountKey,
    onSelectAccount,
}: TokenListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenSymbol(state, accountKey, contract),
    );

    const handleOnPress = () => {
        onSelectAccount(accountKey, contract);
    };

    return (
        <TouchableOpacity onPress={handleOnPress}>
            <Box style={applyStyle(horizontalLine)} />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box flex={1} flexDirection="row" alignItems="center">
                    <Box marginRight="m">
                        <RoundedIcon name={contract} />
                    </Box>
                    <Text style={applyStyle(accountDescriptionStyle)}>{label}</Text>
                </Box>
                <Box style={applyStyle(valuesContainerStyle)}>
                    <EthereumTokenToFiatAmountFormatter
                        value={balance ?? '0'}
                        contract={contract}
                    />
                    <EthereumTokenAmountFormatter
                        value={balance ?? '0'}
                        symbol={tokenSymbol}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    />
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
