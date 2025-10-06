import { ComponentProps } from 'react';

import { AccordionList, Box, BulletListItem, Text, VStack } from '@suite-native/atoms';
import { useCoinLabel } from '@suite-native/device';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { isAndroid } from '@trezor/env-utils';
import { TREZOR_SUPPORT_BLUETOOTH_TROUBLESHOOTING, TREZOR_SUPPORT_DEVICE_URL } from '@trezor/urls';

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

const BluetoothAndroidFAQ = ({ coinLabel }: { coinLabel: string }) => (
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
                        <AccordionContentText translationKey="moduleSettings.faq.bluetoothEnabled.android.3.answer.subtitle" />

                        <Box marginTop="sp4">
                            <Text variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.cabled.title" />
                            </Text>
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

                        <Box marginVertical="sp4">
                            <Text variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.title" />
                            </Text>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.0" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.1" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.2" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.3" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.4" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.5" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.6" />
                            </BulletListItem>
                        </Box>

                        <AccordionContentText
                            translationKey="moduleSettings.faq.bluetoothEnabled.android.3.answer.footer"
                            values={{
                                link: chunk => (
                                    <Link
                                        label={chunk}
                                        textVariant="label"
                                        href={`${TREZOR_SUPPORT_DEVICE_URL}#open-chat`}
                                        isUnderlined
                                    />
                                ),
                            }}
                        />
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
                        <BulletListItem variant="label">
                            <Translation id="moduleSettings.faq.bluetoothEnabled.android.4.answer.4" />
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

const BluetoothIOSFAQ = ({ coinLabel }: { coinLabel: string }) => (
    <AccordionList
        items={[
            {
                title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.0.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.bluetoothEnabled.ios.0.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.1.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.bluetoothEnabled.ios.1.answer" />
                ),
            },
            {
                title: (
                    <Translation
                        id="moduleSettings.faq.bluetoothEnabled.ios.2.question"
                        values={{
                            coinLabel,
                        }}
                    />
                ),
                content: (
                    <AccordionContentText
                        translationKey="moduleSettings.faq.bluetoothEnabled.ios.2.answer"
                        values={{
                            coinLabel,
                        }}
                    />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.question" />,
                content: (
                    <Box>
                        <AccordionContentText translationKey="moduleSettings.faq.bluetoothEnabled.ios.3.answer.subtitle" />

                        <Box marginVertical="sp4">
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.0" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.1" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.2" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.3" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.4" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.5" />
                            </BulletListItem>
                            <BulletListItem variant="label">
                                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.6" />
                            </BulletListItem>
                        </Box>

                        <AccordionContentText
                            translationKey="moduleSettings.faq.bluetoothEnabled.ios.3.answer.footer"
                            values={{
                                link: chunk => (
                                    <Link
                                        label={chunk}
                                        textVariant="label"
                                        href={`${TREZOR_SUPPORT_BLUETOOTH_TROUBLESHOOTING}#open-chat`}
                                        isUnderlined
                                    />
                                ),
                            }}
                        />
                    </Box>
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.4.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.bluetoothEnabled.ios.4.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.5.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.bluetoothEnabled.ios.5.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.6.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.bluetoothEnabled.ios.6.answer" />
                ),
            },
            {
                title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.7.question" />,
                content: (
                    <AccordionContentText translationKey="moduleSettings.faq.bluetoothEnabled.ios.7.answer" />
                ),
            },
        ]}
    />
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
    const isBluetoothEnabled = useFeatureFlag(FeatureFlag.IsBluetoothEnabled);
    const coinLabel = useCoinLabel();

    const renderFAQByPlatformAndFF = () => {
        if (isBluetoothEnabled) {
            return isAndroid() ? (
                // New Android version, both Bluetooth and USB connection are available
                <BluetoothAndroidFAQ coinLabel={coinLabel} />
            ) : (
                // New iOS version, only Bluetooth connection is available
                <BluetoothIOSFAQ coinLabel={coinLabel} />
            );
        }

        if (isUsbDeviceConnectFeatureEnabled) {
            // Old Android version, only USB connection is available
            return <EnabledUsbFAQ coinLabel={coinLabel} />;
        }

        // Old iOS version, only Portfolio Tracker is available
        return <DisabledUsbFAQ coinLabel={coinLabel} />;
    };

    return <VStack paddingHorizontal="sp8">{renderFAQByPlatformAndFF()}</VStack>;
};
