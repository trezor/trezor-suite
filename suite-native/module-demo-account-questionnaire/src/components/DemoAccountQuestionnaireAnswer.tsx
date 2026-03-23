import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { Card, HStack, OrderedListIcon, Radio, Text } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const cardStyle = prepareNativeStyle<{ isSelected: boolean }>((utils, { isSelected }) => ({
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: utils.borders.widths.small,
    padding: 1, // Prevents content jumping when borderWidth changes after isSelected becomes true.
    extend: [
        {
            condition: isSelected,
            style: {
                borderColor: utils.colors.backgroundPrimaryDefault,
                borderWidth: utils.borders.widths.large,
                padding: 0,
            },
        },
    ],
}));

const labelStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

export type DemoAccountQuestionnaireAnswerProps = {
    iconName?: IconName;
    isSelected: boolean;
    label: ReactNode;
    onSelect: () => void;
    value: string;
};

export const DemoAccountQuestionnaireAnswer = ({
    iconName,
    isSelected,
    label,
    onSelect,
    value,
}: DemoAccountQuestionnaireAnswerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onSelect}>
            <Card noPadding style={applyStyle(cardStyle, { isSelected })}>
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
                    <Radio value={value} onPress={onSelect} isChecked={isSelected} />
                </HStack>
            </Card>
        </Pressable>
    );
};
