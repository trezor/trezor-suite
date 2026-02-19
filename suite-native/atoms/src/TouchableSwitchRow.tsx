import { ReactNode } from 'react';

import { Icon, IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

import { Box } from './Box';
import { Button } from './Button/Button';
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
    learnMoreUrl?: string;
};

export const TouchableSwitchRowDescription = ({ children }: { children: ReactNode }) => (
    <Text variant="body-sm" color="textSubdued">
        {children}
    </Text>
);

const LearnMoreButton = ({ learnMoreUrl }: { learnMoreUrl: string }) => {
    const openLink = useOpenLink();

    const handleButtonPress = () => {
        openLink(learnMoreUrl);
    };

    return (
        <Button
            size="small"
            viewLeft="arrowSquareOut"
            onPress={handleButtonPress}
            colorScheme="tertiaryElevation0"
        >
            <Translation id="generic.buttons.learnMore" />
        </Button>
    );
};

export const TouchableSwitchRow = ({
    icon,
    accessibilityLabel,
    text,
    description,
    isChecked,
    onChange,
    testID,
    learnMoreUrl,
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
                    <VStack flex={1}>
                        <HStack justifyContent="space-between" flex={1}>
                            <VStack flex={1} spacing="sp2">
                                <Text variant="body-md-strong">{text}</Text>
                                <Text variant="body-sm" color="textSubdued">
                                    {description}
                                </Text>
                            </VStack>
                            <Switch
                                testID={testID}
                                isChecked={isChecked}
                                onChange={() => onChange(!isChecked)}
                            />
                        </HStack>
                        {learnMoreUrl && <LearnMoreButton learnMoreUrl={learnMoreUrl} />}
                    </VStack>
                </HStack>
            </PressableOpacity>
        </Card>
    );
};
