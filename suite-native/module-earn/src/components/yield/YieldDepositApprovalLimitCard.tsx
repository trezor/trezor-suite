import { type PropsWithChildren, type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, Radio, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';

type YieldDepositApprovalLimitCardProps = {
    contractAddress?: string;
    description: ReactNode;
    isChecked: boolean;
    onChange: () => void;
    symbol: NetworkSymbol;
    title: ReactNode;
} & PropsWithChildren;

export const YieldDepositApprovalLimitCard = ({
    children,
    contractAddress,
    description,
    isChecked,
    onChange,
    symbol,
    title,
}: YieldDepositApprovalLimitCardProps) => (
    <Pressable onPress={onChange}>
        <Card>
            <VStack>
                <HStack alignItems="center" justifyContent="space-between">
                    <HStack alignItems="center">
                        <TokenIcon
                            symbol={symbol}
                            contractAddress={contractAddress}
                            size="extraSmall"
                        />
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
);
