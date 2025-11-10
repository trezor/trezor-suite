import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon, IconName } from '@suite-native/icons';

import { Box } from './Box';
import { Card } from './Card/Card';
import { HStack, VStack } from './Stack';
import { Switch } from './Switch';
import { Text } from './Text';

type TouchableSwitchRowProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    text: ReactNode;
    accessibilityLabel: string;
    description?: ReactNode;
    iconName: IconName;
    testID?: string;
};

export const TouchableSwitchRowDescription = ({ children }: { children: ReactNode }) => (
    <Text variant="hint" color="textSubdued">
        {children}
    </Text>
);

export const TouchableSwitchRow = ({
    isChecked,
    onChange,
    text,
    description,
    accessibilityLabel,
    iconName,
    testID,
}: TouchableSwitchRowProps) => {
    const handleChange = () => {
        onChange(!isChecked);
    };

    return (
        <Card borderColor="borderElevation1" noPadding>
            <TouchableOpacity
                onPress={handleChange}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="switch"
                accessibilityState={{ checked: isChecked }}
            >
                <HStack margin="sp16" spacing="sp12">
                    <Box marginVertical="sp2">
                        <Icon name={iconName} size="mediumLarge" />
                    </Box>
                    <HStack justifyContent="space-between" flex={1}>
                        <VStack flex={1} spacing="sp2">
                            <Text variant="highlight">{text}</Text>
                            <Text variant="hint" color="textSubdued">
                                {description}
                            </Text>
                        </VStack>
                        <Switch testID={testID} isChecked={isChecked} onChange={handleChange} />
                    </HStack>
                </HStack>
            </TouchableOpacity>
        </Card>
    );
};
