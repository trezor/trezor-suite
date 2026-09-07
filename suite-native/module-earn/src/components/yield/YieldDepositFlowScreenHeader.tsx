import { type ReactNode } from 'react';

import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { Box, HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { CompactCryptoAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { type CloseActionType, ScreenHeader } from '@suite-native/navigation';

type YieldDepositFlowScreenHeaderProps = {
    account: Account;
    closeAction?: () => void;
    closeActionType?: CloseActionType;
    onInfoPress?: () => void;
    title: ReactNode;
    tokenContract: TokenAddress;
};

export const YieldDepositFlowScreenHeader = ({
    account,
    closeAction,
    closeActionType = 'close',
    onInfoPress,
    title,
    tokenContract,
}: YieldDepositFlowScreenHeaderProps) => {
    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;

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
                            {title}
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
                            <CompactCryptoAmountFormatter
                                value={account.formattedBalance}
                                symbol={account.symbol}
                                variant="body-xs"
                                color="contentSecondary"
                                numberOfLines={1}
                                testID="@yield/flow-header/balance"
                            />
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
