import { ReactNode } from 'react';

import { Icon, IconName } from '@suite-native/icons';

import { Box } from './Box';
import { Card } from './Card/Card';
import { PressableOpacity } from './Pressable';
import { HStack, VStack } from './Stack';
import { Switch } from './Switch';
import { Text } from './Text';

export type TouchableSwitchRowProps = {
    icon: IconName;
    accessibilityLabel: string;
    text: ReactNode;
    description?: ReactNode;
    isChecked: boolean;
    onChange: (value: boolean) => void;
    testID?: string;
};

export const TouchableSwitchRowDescription = ({ children }: { children: ReactNode }) => (
    <Text variant="hint" color="textSubdued">
        {children}
    </Text>
);

export const TouchableSwitchRow = ({
    icon,
    accessibilityLabel,
    text,
    description,
    isChecked,
    onChange,
    testID,
}: TouchableSwitchRowProps) => {
    const handleChange = () => {
        onChange(!isChecked);
    };

    return (
        <Card borderColor="borderElevation1" noPadding>
            <PressableOpacity
                onPress={handleChange}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="switch"
                accessibilityState={{ checked: isChecked }}
            >
                <HStack margin="sp16" spacing="sp12">
                    <Box marginVertical="sp2">
                        <Icon name={icon} size="mediumLarge" />
                    </Box>
                    <HStack justifyContent="space-between" flex={1}>
                        <VStack flex={1} spacing="sp2">
                            <Text variant="highlight">{text}</Text>
                            <Text variant="hint" color="textSubdued">
                                {description}
                            </Text>
                        </VStack>
                        <Switch
                            testID={testID}
                            isChecked={isChecked}
                            onChange={() => onChange(!isChecked)}
                        />
                    </HStack>
                </HStack>
            </PressableOpacity>
        </Card>
    );
};
