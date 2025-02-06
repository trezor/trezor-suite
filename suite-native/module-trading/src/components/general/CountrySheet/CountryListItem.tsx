import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { Card, HStack, Radio, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type CountryListItemProps = {
    flag: IconName;
    id: string;
    name: ReactNode;
    isSelected: boolean;
    onPress: () => void;
};

export const COUNTRY_LIST_ITEM_HEIGHT = 64 as const;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

export const CountryListItem = ({ flag, name, onPress, id, isSelected }: CountryListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress} style={applyStyle(wrapperStyle)}>
            <Card>
                <HStack alignItems="center" justifyContent="space-between">
                    <HStack>
                        <Icon name={flag} size="medium" />
                        <Text variant="body" color="textDefault">
                            {name}
                        </Text>
                    </HStack>
                    <Radio value={id} onPress={onPress} isChecked={isSelected} />
                </HStack>
            </Card>
        </Pressable>
    );
};
