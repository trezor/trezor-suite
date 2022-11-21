import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { IconButton, Text } from '@suite-native/atoms';

import { ScreenHeaderWithIcons } from './ScreenHeaderWithIcons';

type ScreenHeaderProps = {
    title?: string;
};

export const ScreenHeader = ({ title }: ScreenHeaderProps) => {
    const navigation = useNavigation();

    return (
        <ScreenHeaderWithIcons
            leftIcon={
                <IconButton
                    iconName="chevronLeft"
                    size="large"
                    colorScheme="gray"
                    onPress={() => navigation.goBack()}
                    isRounded
                />
            }
        >
            {title && <Text variant="titleSmall">{title}</Text>}
        </ScreenHeaderWithIcons>
    );
};
