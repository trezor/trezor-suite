import { type PropsWithChildren, type ReactNode, memo } from 'react';
import { Pressable } from 'react-native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, Radio, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';

export type ExchangeApprovalLimitCardProps = {
    title: ReactNode;
    description: ReactNode;
    symbol?: NetworkSymbol;
    contractAddress?: string;
    tokenSymbol?: string;
    isChecked?: boolean;
    onChange: () => void;
} & PropsWithChildren;

export const ExchangeApprovalLimitCard = memo(
    ({
        title,
        description,
        symbol,
        contractAddress,
        tokenSymbol,
        isChecked = false,
        onChange,
        children,
    }: ExchangeApprovalLimitCardProps) => (
        <Pressable onPress={onChange}>
            <Card>
                <VStack>
                    <HStack alignItems="center" justifyContent="space-between">
                        <HStack alignItems="center">
                            {!!symbol && (
                                <TokenIcon
                                    networkSymbol={symbol}
                                    contractAddress={contractAddress}
                                    tokenSymbol={tokenSymbol}
                                    size="extraSmall"
                                />
                            )}
                            {title}
                        </HStack>
                        <Radio value="option" isChecked={isChecked} onPress={onChange} />
                    </HStack>
                    <Text variant="body-sm" color="contentSecondary">
                        {description}
                    </Text>
                    {children}
                </VStack>
            </Card>
        </Pressable>
    ),
);
