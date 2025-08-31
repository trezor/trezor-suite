import { ComponentProps } from 'react';

import { AccordionList, Box, BulletListItem, Text, VStack } from '@suite-native/atoms';
import { useCoinLabel } from '@suite-native/device';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation, TxKeyPath } from '@suite-native/intl';

const AccordionContentText = ({
    translationKey,
    values = {},
}: {
    translationKey: TxKeyPath;
    values?: ComponentProps<typeof Translation>['values'];
}) => (
    <Text variant="label">
        <Translation id={translationKey} values={values} />
    </Text>
);

const EnabledUsbFAQ = ({ coinLabel }: { coinLabel: string }) => (
    <AccordionList
        items={[
            {
                title: <Translation id="moduleSettings.faq.usbEnabled.0.question" />,
                content: (
                    <AccordionContentText
                        translationKey="moduleSettings.faq.usbEnabled.0.answer"
                        values={{
                            coinLabel,
                        }}
                    />
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

const DisabledUsbFAQ = ({ coinLabel }: { coinLabel: string }) => (
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
                title: (
                    <Translation
                        id="moduleSettings.faq.usbDisabled.2.question"
                        values={{
                            coinLabel,
                        }}
                    />
                ),
                content: (
                    <AccordionContentText
                        translationKey="moduleSettings.faq.usbDisabled.2.answer"
                        values={{
                            coinLabel,
                        }}
                    />
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
    const coinLabel = useCoinLabel();

    return (
        <VStack paddingHorizontal="sp8">
            {isUsbDeviceConnectFeatureEnabled ? (
                <EnabledUsbFAQ coinLabel={coinLabel} />
            ) : (
                <DisabledUsbFAQ coinLabel={coinLabel} />
            )}
        </VStack>
    );
};
