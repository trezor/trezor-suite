import { type ReactNode } from 'react';

import { Button, IconList, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { Screen } from '@suite-native/navigation';

const InformativeList = () => (
    <IconList iconIntent="critical" iconSize={36}>
        <IconListTextItem icon="plugs">
            <Translation id="moduleAuthenticityChecks.deviceCompromised.steps.disconnectDevice" />
        </IconListTextItem>
        <IconListTextItem icon="handPalm">
            <Translation id="moduleAuthenticityChecks.deviceCompromised.steps.avoidUsingDevice" />
        </IconListTextItem>
        <IconListTextItem icon="chatCircle">
            <Translation id="moduleAuthenticityChecks.deviceCompromised.steps.contactSupport" />
        </IconListTextItem>
    </IconList>
);

type DeviceCompromisedModalContentProps = {
    contactSupportUrl: string;
    screenHeaderContent: ReactNode;
    closeButtonContent?: ReactNode;
    subtitleContent?: ReactNode;
};

export const DeviceCompromisedModalContent = ({
    contactSupportUrl,
    screenHeaderContent,
    closeButtonContent,
    subtitleContent,
}: DeviceCompromisedModalContentProps) => {
    const openLink = useOpenLink();

    const handleContactSupportClick = () => openLink(`${contactSupportUrl}#open-chat`);

    return (
        <Screen header={screenHeaderContent}>
            <VStack spacing="sp32" flex={1}>
                <TitleHeader
                    titleVariant="headline-md"
                    titleSpacing="sp12"
                    title={<Translation id="moduleAuthenticityChecks.deviceCompromised.title" />}
                    subtitle={subtitleContent}
                />
                <InformativeList />
            </VStack>
            <VStack spacing="sp12">
                <Button intent="critical" priority="primary" onPress={handleContactSupportClick}>
                    <Translation id="moduleAuthenticityChecks.deviceCompromised.buttonContactSupport" />
                </Button>
                {closeButtonContent}
            </VStack>
        </Screen>
    );
};
