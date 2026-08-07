import { useSelector } from 'react-redux';

import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { formatCoinBalance } from '@suite-common/wallet-utils';
import { Box, DiscreetText, HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { selectSupportedLanguageLocale } from '@suite-native/intl';
import { type CloseActionType, ScreenHeader } from '@suite-native/navigation';

type YieldDepositFlowScreenHeaderProps = {
    account: Account;
    closeAction?: () => void;
    closeActionType?: CloseActionType;
    onInfoPress?: () => void;
    tokenContract: TokenAddress;
    vaultName: string;
};

export const YieldDepositFlowScreenHeader = ({
    account,
    closeAction,
    closeActionType = 'close',
    onInfoPress,
    tokenContract,
    vaultName,
}: YieldDepositFlowScreenHeaderProps) => {
    const locale = useSelector(selectSupportedLanguageLocale);
    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    // Same format as the desktop yield page header: `formatCoinBalance` keeps the leading
    // significant digits and appends an ellipsis (…) once the fractional part gets too long.
    const formattedBalance = `${formatCoinBalance(account.formattedBalance, locale)} ${getNetworkDisplaySymbol(account.symbol)}`;

    return (
        <ScreenHeader
            closeActionType={closeActionType}
            closeAction={closeAction}
            customContent={
                <HStack spacing="sp8" alignItems="center" flexShrink={1}>
                    <TokenIcon
                        symbol={account.symbol}
                        contractAddress={tokenContract}
                        size="small"
                        showNetworkIcon
                        wrappedTokenIcon="network"
                    />
                    <VStack spacing={0} flexShrink={1}>
                        <Text variant="body-md" numberOfLines={1} ellipsizeMode="tail">
                            {vaultName}
                        </Text>
                        <HStack spacing="sp24" justifyContent="space-between" alignItems="center">
                            <Box flexShrink={1}>
                                <Text
                                    variant="body-xs"
                                    color="contentSecondary"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {accountLabel}
                                </Text>
                            </Box>
                            <DiscreetText
                                variant="body-xs"
                                color="contentSecondary"
                                numberOfLines={1}
                                testID="@yield/flow-header/balance"
                            >
                                {formattedBalance}
                            </DiscreetText>
                        </HStack>
                    </VStack>
                </HStack>
            }
            rightIcon={
                onInfoPress && (
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        iconName="info"
                        onPress={onInfoPress}
                    />
                )
            }
        />
    );
};
