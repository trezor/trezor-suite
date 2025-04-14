import { AccordionList, Box, BulletListItem, Text, VStack } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation, TxKeyPath } from '@suite-native/intl';

const AccordionContentText = ({ translationKey }: { translationKey: TxKeyPath }) => (
    <Text variant="label">
        <Translation id={translationKey} />
    </Text>
);

const EnabledUsbFAQ = () => (
    <AccordionList
        items={[
            {
                title: <Translation id="moduleSettings.faq.usbEnabled.0.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.0.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbEnabled.1.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.1.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbEnabled.2.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.2.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbEnabled.3.question" />,
                content: (
                    <Box>
                        <BulletListItem variant="label">
                            <Translation id="moduleSettings.faq.usbEnabled.3.answer.0" />
                        </BulletListItem>
                        <BulletListItem variant="label">
                            <Translation id="moduleSettings.faq.usbEnabled.3.answer.1" />
                        </BulletListItem>
                        <BulletListItem variant="label">
                            <Translation id="moduleSettings.faq.usbEnabled.3.answer.2" />
                        </BulletListItem>
                        <BulletListItem variant="label">
                            <Translation id="moduleSettings.faq.usbEnabled.3.answer.3" />
                        </BulletListItem>
                    </Box>
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbEnabled.4.question" />,
                content: (
                    <Box style={{ position: 'relative' }}>
                        <BulletListItem variant="label">
                            <Translation id="moduleSettings.faq.usbEnabled.4.answer.0" />
                        </BulletListItem>
                        <BulletListItem variant="label">
                            <Translation id="moduleSettings.faq.usbEnabled.4.answer.1" />
                        </BulletListItem>
                        <BulletListItem variant="label">
                            <Translation id="moduleSettings.faq.usbEnabled.4.answer.2" />
                        </BulletListItem>
                        <BulletListItem variant="label">
                            <Translation id="moduleSettings.faq.usbEnabled.4.answer.3" />
                        </BulletListItem>
                    </Box>
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbEnabled.5.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.5.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbEnabled.6.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.6.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbEnabled.7.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.7.answer" />
                ),
            },
        ]}
    />
);

const DisabledUsbFAQ = () => (
    <AccordionList
        items={[
            {
                title: <Translation id="moduleSettings.faq.usbDisabled.0.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbDisabled.0.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbDisabled.1.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbDisabled.1.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbDisabled.2.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbDisabled.2.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbDisabled.3.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbDisabled.3.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbDisabled.4.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbDisabled.4.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.usbDisabled.5.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.usbDisabled.5.answer" />
                ),
            },
        ]}
    />
);

export const FAQInfoPanel = () => {
    const isUsbDeviceConnectFeatureEnabled = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    return (
        <VStack paddingHorizontal="sp8">
            {isUsbDeviceConnectFeatureEnabled ? <EnabledUsbFAQ /> : <DisabledUsbFAQ />}
        </VStack>
    );
};
