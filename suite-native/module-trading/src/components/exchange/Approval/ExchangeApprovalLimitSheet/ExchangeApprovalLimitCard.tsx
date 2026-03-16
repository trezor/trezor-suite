import { type ReactNode, memo } from 'react';
import { Pressable } from 'react-native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, Radio, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';

export type ExchangeApprovalLimitCardProps = {
    title: ReactNode;
    description: ReactNode;
    symbol?: NetworkSymbol;
    contractAddress?: string;
    isChecked?: boolean;
    onChange: () => void;
};

export const ExchangeApprovalLimitCard = memo(
    ({
        title,
        description,
        symbol,
        contractAddress,
        isChecked = false,
        onChange,
    }: ExchangeApprovalLimitCardProps) => (
        <Pressable onPress={onChange}>
            <Card>
                <HStack alignItems="center" justifyContent="space-between" marginBottom="sp12">
                    <HStack alignItems="center">
                        {!!symbol && (
                            <CryptoIcon
                                symbol={symbol}
                                contractAddress={contractAddress}
                                size="extraSmall"
                            />
                        )}
                        {title}
                    </HStack>
                    <Radio value="option" isChecked={isChecked} onPress={onChange} />
                </HStack>
                <Text variant="body-sm" color="textSubdued">
                    {description}
                </Text>
            </Card>
        </Pressable>
    ),
);
