import { ReactNode } from 'react';

import { Button, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { Screen } from '@suite-native/navigation';

const InformativeList = () => (
    <VStack spacing="sp24">
        <IconListTextItem icon="plugs" variant="red">
            <Translation id="moduleAuthenticityChecks.deviceCompromised.steps.disconnectDevice" />
        </IconListTextItem>

        <IconListTextItem icon="handPalm" variant="red">
            <Translation id="moduleAuthenticityChecks.deviceCompromised.steps.avoidUsingDevice" />
        </IconListTextItem>

        <IconListTextItem icon="chatCircle" variant="red">
            <Translation id="moduleAuthenticityChecks.deviceCompromised.steps.contactSupport" />
        </IconListTextItem>
    </VStack>
);

type DeviceCompromisedModalContentProps = {
    contactSupportUrl: string;
    screenHeaderContent: ReactNode;
    closeButtonContent?: ReactNode;
};

export const DeviceCompromisedModalContent = ({
    contactSupportUrl,
    screenHeaderContent,
    closeButtonContent,
}: DeviceCompromisedModalContentProps) => {
    const openLink = useOpenLink();

    const handleContactSupportClick = () => openLink(contactSupportUrl);

    return (
        <Screen header={screenHeaderContent}>
            <VStack spacing="sp32" flex={1}>
                <TitleHeader
                    titleVariant="titleMedium"
                    titleSpacing="sp12"
                    title={<Translation id="moduleAuthenticityChecks.deviceCompromised.title" />}
                    subtitle={
                        <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle" />
                    }
                />
                <InformativeList />
            </VStack>
            <VStack spacing="sp12">
                <Button colorScheme="redBold" onPress={handleContactSupportClick}>
                    <Translation id="moduleAuthenticityChecks.deviceCompromised.buttonContactSupport" />
                </Button>
                {closeButtonContent}
            </VStack>
        </Screen>
    );
};
