import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { Box, Card, HStack, RoundedIcon, Switch, Text } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TouchableSwitchRowProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    text: ReactNode;
    accessibilityLabel: string;
    description?: ReactNode;
    iconName: IconName;
    testID?: string;
};

const textStyle = prepareNativeStyle(utils => ({
    marginLeft: utils.spacings.sp12,
    flex: 1,
}));

const contentStyle = prepareNativeStyle(_ => ({
    maxWidth: '75%',
}));

export const PressableSwitchRow = ({
    isChecked,
    onChange,
    text,
    description,
    accessibilityLabel,
    iconName,
    testID,
}: TouchableSwitchRowProps) => {
    const { applyStyle } = useNativeStyles();

    const handleChange = () => {
        onChange(!isChecked);
    };

    return (
        <Pressable
            onPress={handleChange}
            accessibilityRole="switch"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ checked: isChecked }}
            testID={testID}
        >
            <Card>
                <HStack justifyContent="space-between" alignItems="center" spacing="sp12">
                    <Box style={applyStyle(contentStyle)} flexDirection="row" alignItems="center">
                        <RoundedIcon name={iconName} color="iconSubdued" />
                        <Box alignItems="flex-start" style={applyStyle(textStyle)}>
                            <Text>{text}</Text>
                            {description && <Box>{description}</Box>}
                        </Box>
                    </Box>
                    <Switch isChecked={isChecked} onChange={handleChange} />
                </HStack>
            </Card>
        </Pressable>
    );
};
