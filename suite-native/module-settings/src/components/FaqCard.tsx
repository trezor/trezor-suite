import { type ComponentProps, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { AccordionList, Box, BulletListItem, Card, Text, VStack } from '@suite-native/atoms';
import { useCoinLabel } from '@suite-native/device';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { selectIsTradingEnabled } from '@suite-native/trading-state';
import { isAndroid } from '@trezor/env-utils';
import {
    TREZOR_SUPPORT_BLUETOOTH_TROUBLESHOOTING,
    TREZOR_SUPPORT_DEVICE_URL,
    TREZOR_SUPPORT_TRADING_URL,
} from '@trezor/urls';

const AccordionContentText = ({
    translationKey,
    values = {},
}: {
    translationKey: TxKeyPath;
    values?: ComponentProps<typeof Translation>['values'];
}) => (
    <Text variant="body-xs">
        <Translation id={translationKey} values={values} />
    </Text>
);

const getAndroidFaqItems = (coinLabel: string) => [
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
        content: <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.1.answer" />,
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.2.question" />,
        content: <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.2.answer" />,
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.3.question" />,
        content: (
            <Box>
                <AccordionContentText translationKey="moduleSettings.faq.bluetoothEnabled.android.3.answer.subtitle" />

                <Box marginTop="sp4">
                    <Text variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.cabled.title" />
                    </Text>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.usbEnabled.3.answer.0" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.usbEnabled.3.answer.1" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.usbEnabled.3.answer.2" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.usbEnabled.3.answer.3" />
                    </BulletListItem>
                </Box>

                <Box marginVertical="sp4">
                    <Text variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.title" />
                    </Text>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.0" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.1" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.2" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.3" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.4" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.5" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.6" />
                    </BulletListItem>
                </Box>

                <AccordionContentText
                    translationKey="moduleSettings.faq.bluetoothEnabled.android.3.answer.footer"
                    values={{
                        link: chunk => (
                            <Link
                                label={chunk}
                                textVariant="body-xs"
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
                <BulletListItem variant="body-xs">
                    <Translation id="moduleSettings.faq.usbEnabled.4.answer.0" />
                </BulletListItem>
                <BulletListItem variant="body-xs">
                    <Translation id="moduleSettings.faq.usbEnabled.4.answer.1" />
                </BulletListItem>
                <BulletListItem variant="body-xs">
                    <Translation id="moduleSettings.faq.usbEnabled.4.answer.2" />
                </BulletListItem>
                <BulletListItem variant="body-xs">
                    <Translation id="moduleSettings.faq.usbEnabled.4.answer.3" />
                </BulletListItem>
                <BulletListItem variant="body-xs">
                    <Translation id="moduleSettings.faq.bluetoothEnabled.android.4.answer.4" />
                </BulletListItem>
            </Box>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.5.question" />,
        content: <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.5.answer" />,
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.6.question" />,
        content: <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.6.answer" />,
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.7.question" />,
        content: <AccordionContentText translationKey="moduleSettings.faq.usbEnabled.7.answer" />,
    },
];

const getIosFaqItems = (coinLabel: string) => [
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
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.0" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.1" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.2" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.3" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.4" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.5" />
                    </BulletListItem>
                    <BulletListItem variant="body-xs">
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.6" />
                    </BulletListItem>
                </Box>

                <AccordionContentText
                    translationKey="moduleSettings.faq.bluetoothEnabled.ios.3.answer.footer"
                    values={{
                        link: chunk => (
                            <Link
                                label={chunk}
                                textVariant="body-xs"
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
];

export const FaqCard = () => {
    const coinLabel = useCoinLabel();
    const isTradingEnabled = useSelector(selectIsTradingEnabled);

    const items = useMemo(() => {
        const itemsData = isAndroid() ? getAndroidFaqItems(coinLabel) : getIosFaqItems(coinLabel);

        if (isTradingEnabled) {
            itemsData.push({
                title: <Translation id="moduleSettings.faq.trading.question" />,
                content: (
                    <AccordionContentText
                        translationKey="moduleSettings.faq.trading.answer"
                        values={{
                            link: chunk => (
                                <Link
                                    label={chunk}
                                    textVariant="body-xs"
                                    href={TREZOR_SUPPORT_TRADING_URL}
                                    isUnderlined
                                />
                            ),
                        }}
                    />
                ),
            });
        }

        return itemsData;
    }, [coinLabel, isTradingEnabled]);

    return (
        <Card>
            <VStack>
                <AccordionList items={items} />
            </VStack>
        </Card>
    );
};
