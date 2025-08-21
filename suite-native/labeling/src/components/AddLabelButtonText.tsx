import { ReactNode } from 'react';
import { FlexStyle, Pressable } from 'react-native';

import { HStack, Text } from '@suite-native/atoms';
import { Icon, iconSizes } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type AddLabelButtonTextProps = {
    onPress: () => void;
    justifyContent?: FlexStyle['justifyContent'];
    label?: ReactNode;
};

export const AddLabelButtonText = ({ onPress, justifyContent, label }: AddLabelButtonTextProps) => (
    <Pressable onPress={onPress}>
        <HStack spacing="sp8" justifyContent={justifyContent}>
            <Text textAlign="center" color="textPrimaryDefault" testID="@receive/addLabel">
                {label ?? <Translation id="labeling.addLabel" />}
            </Text>
            <Icon name="pencil" color="textPrimaryDefault" size={iconSizes.mediumLarge} />
        </HStack>
    </Pressable>
);
