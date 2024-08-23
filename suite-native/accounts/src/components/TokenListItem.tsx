import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { AccountsRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Box, RoundedIcon, Text } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { selectEthereumAccountTokenSymbol } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TokenListItemProps = {
    balance?: string;
    label: string;
    accountKey: AccountKey;
    contract: TokenAddress;
    onSelectAccount: () => void;
};

const tokenListItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: utils.spacings.medium,
}));

const accountDescriptionStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.small,
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

    return (
        <TouchableOpacity onPress={onSelectAccount}>
            <Box style={applyStyle(tokenListItemStyle)}>
                <Box flex={1} flexDirection="row" alignItems="center">
                    <Box marginRight="medium">
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
