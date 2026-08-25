import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountLabel } from '@suite-native/accounts';
import { Box, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Icon, TokenIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnClaimTokenIconSet } from './EarnClaimTokenIconSet';
import { type StablecoinYieldClaimSummary } from '../types';

const rowStyle = prepareNativeStyle(utils => ({
    minHeight: 80,
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
}));

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
    overflow: 'hidden',
}));

type StablecoinYieldClaimAccountCardProps = {
    summary: StablecoinYieldClaimSummary;
    onPress: () => void;
};

export const StablecoinYieldClaimAccountCard = ({
    summary,
    onPress,
}: StablecoinYieldClaimAccountCardProps) => {
    const { applyStyle } = useNativeStyles();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, summary.accountKey),
    );
    const tokenSymbols = summary.tokens.map(({ symbol }) => symbol).join(', ');

    return (
        <PressableOpacity
            onPress={onPress}
            style={applyStyle(rowStyle)}
            testID={`@earn/claim-account/${summary.accountKey}`}
        >
            <Box marginRight="sp12">
                <TokenIcon symbol={summary.networkSymbol} size="small" />
            </Box>

            <VStack spacing="sp4" style={applyStyle(contentStyle)}>
                {account ? (
                    <AccountLabel
                        account={account}
                        showAccountTypeBadge
                        variant="body-md-strong"
                        numberOfLines={1}
                    />
                ) : (
                    <Text variant="body-md-strong" numberOfLines={1}>
                        {getNetworkDisplaySymbolName(summary.networkSymbol)}
                    </Text>
                )}
                <HStack spacing="sp6" alignItems="center">
                    <EarnClaimTokenIconSet tokens={summary.tokens} />
                    <Text
                        variant="body-sm"
                        color="contentSecondary"
                        numberOfLines={1}
                        style={{ flexShrink: 1 }}
                    >
                        {tokenSymbols}
                    </Text>
                </HStack>
            </VStack>

            <HStack spacing="sp8" alignItems="center" marginLeft="sp8">
                <BaseCurrencyAmountFormatter
                    value={summary.fiatClaimableAmount}
                    variant="body-md-strong"
                    isDiscreetText={false}
                    numberOfLines={1}
                />
                <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
            </HStack>
        </PressableOpacity>
    );
};
