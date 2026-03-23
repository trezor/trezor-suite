import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { Card, HStack, OrderedListIcon, Text } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const labelStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

export type DemoAccountQuestionnaireLinkProps = {
    iconName?: IconName;
    label: ReactNode;
    onPress: () => void;
};

export const DemoAccountQuestionnaireLink = ({
    iconName,
    label,
    onPress,
}: DemoAccountQuestionnaireLinkProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress}>
            <Card noPadding>
                <HStack
                    alignItems="center"
                    justifyContent="space-between"
                    padding="sp12"
                    spacing="sp12"
                >
                    <HStack spacing="sp12" alignItems="center" flex={1}>
                        {!!iconName && <OrderedListIcon iconName={iconName} iconSize="large" />}
                        <Text variant="body-md" color="textDefault" style={applyStyle(labelStyle)}>
                            {label}
                        </Text>
                    </HStack>
                    <Icon name="arrowSquareOut" color="textSecondaryHighlight" />
                </HStack>
            </Card>
        </Pressable>
    );
};
