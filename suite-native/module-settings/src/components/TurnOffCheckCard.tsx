import { type ReactNode } from 'react';

import { Button, CardWithIconLayout, HStack, Text, VStack } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { useToast } from '@suite-native/toasts';

interface TurnOffCheckCardProps {
    isEnabled: boolean;
    title: ReactNode;
    subtitle: ReactNode;
    icon: IconName;
    learnMoreUrl?: string;
    onTurnOn: () => void;
    onTurnOff: () => void;
}

const TurnOnButton = ({ onTurnOn }: { onTurnOn: () => void }) => {
    const { showToast } = useToast();
    const handleButtonPress = () => {
        onTurnOn();
        showToast({
            variant: 'default',
            message: <Translation id="moduleSettings.advanced.authenticityChecks.toastOn" />,
            icon: 'check',
        });
    };

    return (
        <Button size="small" flex={1} onPress={handleButtonPress} intent="brand" priority="primary">
            <Translation id="moduleSettings.advanced.authenticityChecks.buttonTurnOn" />
        </Button>
    );
};

const TurnOffButton = ({ onTurnOff }: { onTurnOff: () => void }) => (
    <Button size="small" flex={1} onPress={onTurnOff} intent="warning" priority="secondary">
        <Translation id="moduleSettings.advanced.authenticityChecks.buttonTurnOff" />
    </Button>
);

const LearnMoreButton = ({ learnMoreUrl }: { learnMoreUrl: string }) => {
    const openLink = useOpenLink();

    const handleButtonPress = () => {
        openLink(learnMoreUrl);
    };

    return (
        <Button
            size="small"
            flex={1}
            iconLeft="arrowSquareOut"
            onPress={handleButtonPress}
            intent="neutral"
            priority="secondary"
        >
            <Translation id="moduleSettings.advanced.authenticityChecks.buttonLearnMore" />
        </Button>
    );
};

export const TurnOffCheckCard = ({
    isEnabled,
    title,
    subtitle,
    icon,
    learnMoreUrl,
    onTurnOn,
    onTurnOff,
}: TurnOffCheckCardProps) => (
    <CardWithIconLayout icon={icon} title={title}>
        <VStack spacing="sp16">
            <Text variant="body-sm" color="textSubdued">
                {subtitle}
            </Text>
            <HStack spacing="sp8">
                {learnMoreUrl && <LearnMoreButton learnMoreUrl={learnMoreUrl} />}
                {isEnabled ? (
                    <TurnOffButton onTurnOff={onTurnOff} />
                ) : (
                    <TurnOnButton onTurnOn={onTurnOn} />
                )}
            </HStack>
        </VStack>
    </CardWithIconLayout>
);
