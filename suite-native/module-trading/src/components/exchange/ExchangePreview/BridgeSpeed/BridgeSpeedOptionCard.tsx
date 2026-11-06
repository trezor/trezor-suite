import { memo } from 'react';
import { Pressable } from 'react-native';

import { Card, HStack, Radio, Text, VStack } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';

export type BridgeSpeedOptionCardProps = {
    icon: IconName;
    titleId: TxKeyPath;
    feeId: TxKeyPath;
    descriptionId: TxKeyPath;
    coinSymbol: string | undefined;
    isChecked: boolean;
    onChange: () => void;
    testID?: string;
};

export const BridgeSpeedOptionCard = memo(
    ({
        icon,
        titleId,
        feeId,
        descriptionId,
        coinSymbol,
        isChecked,
        onChange,
        testID,
    }: BridgeSpeedOptionCardProps) => (
        <Pressable onPress={onChange} testID={testID}>
            <Card>
                <VStack spacing="sp8">
                    <HStack alignItems="center" justifyContent="space-between">
                        <HStack alignItems="center" spacing="sp12">
                            <Icon name={icon} size="mediumLarge" color="contentPrimary" />
                            <HStack alignItems="center" spacing="sp8">
                                <Text variant="body-md-strong" color="contentPrimary">
                                    <Translation id={titleId} />
                                </Text>
                                <Text variant="body-md" color="contentSecondary">
                                    <Translation id={feeId} />
                                </Text>
                            </HStack>
                        </HStack>
                        <Radio value="option" isChecked={isChecked} onPress={onChange} />
                    </HStack>
                    <Text variant="body-sm" color="contentSecondary">
                        <Translation id={descriptionId} values={{ symbol: coinSymbol }} />
                    </Text>
                </VStack>
            </Card>
        </Pressable>
    ),
);
