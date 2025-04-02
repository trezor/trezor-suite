import { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedBox, Card, HStack, Radio, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type CountryListItemProps = {
    value: string;
    label: ReactNode;
    isSelected: boolean;
    onPress: () => void;
};

export const COUNTRY_LIST_ITEM_HEIGHT = 64 as const;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

export const CountryListItem = ({ label, onPress, value, isSelected }: CountryListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut}>
            <Pressable onPress={onPress} style={applyStyle(wrapperStyle)}>
                <Card>
                    <HStack alignItems="center" justifyContent="space-between">
                        <HStack>
                            <Text variant="body" color="textDefault">
                                {label}
                            </Text>
                        </HStack>
                        <Radio value={value} onPress={onPress} isChecked={isSelected} />
                    </HStack>
                </Card>
            </Pressable>
        </AnimatedBox>
    );
};
