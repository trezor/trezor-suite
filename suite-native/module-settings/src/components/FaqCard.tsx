import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    AccordionItemList,
    AccordionItemText,
    AccordionList,
    Box,
    BulletListItem,
    Card,
    VStack,
} from '@suite-native/atoms';
import { useCoinLabel } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { selectIsTradingEnabled } from '@suite-native/trading-state';
import { isAndroid } from '@trezor/env-utils';
import {
    TREZOR_SUPPORT_BLUETOOTH_TROUBLESHOOTING,
    TREZOR_SUPPORT_DEVICE_URL,
    TREZOR_SUPPORT_TRADING_URL,
} from '@trezor/urls';

const getAndroidFaqItems = (coinLabel: string) => [
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.0.question" />,
        content: (
            <AccordionItemText>
                <Translation
                    id="moduleSettings.faq.usbEnabled.0.answer"
                    values={{
                        coinLabel,
                    }}
                />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.1.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.usbEnabled.1.answer" />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.2.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.usbEnabled.2.answer" />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.3.question" />,
        content: (
            <VStack spacing="sp4">
                <AccordionItemText>
                    <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.subtitle" />
                </AccordionItemText>
                <Box>
                    <AccordionItemText>
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.cabled.title" />
                    </AccordionItemText>
                    <AccordionItemList>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.usbEnabled.3.answer.0" />
                        </BulletListItem>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.usbEnabled.3.answer.1" />
                        </BulletListItem>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.usbEnabled.3.answer.2" />
                        </BulletListItem>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.usbEnabled.3.answer.3" />
                        </BulletListItem>
                    </AccordionItemList>
                </Box>
                <Box>
                    <AccordionItemText>
                        <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.title" />
                    </AccordionItemText>
                    <AccordionItemList>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.0" />
                        </BulletListItem>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.1" />
                        </BulletListItem>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.2" />
                        </BulletListItem>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.3" />
                        </BulletListItem>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.4" />
                        </BulletListItem>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.5" />
                        </BulletListItem>
                        <BulletListItem>
                            <Translation id="moduleSettings.faq.bluetoothEnabled.android.3.answer.wireless.6" />
                        </BulletListItem>
                    </AccordionItemList>
                </Box>
                <AccordionItemText>
                    <Translation
                        id="moduleSettings.faq.bluetoothEnabled.android.3.answer.footer"
                        values={{
                            link: chunk => (
                                <Link
                                    label={chunk}
                                    textVariant="body-sm"
                                    href={`${TREZOR_SUPPORT_DEVICE_URL}#open-chat`}
                                    isUnderlined
                                />
                            ),
                        }}
                    />
                </AccordionItemText>
            </VStack>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.4.question" />,
        content: (
            <AccordionItemList>
                <BulletListItem>
                    <Translation id="moduleSettings.faq.usbEnabled.4.answer.0" />
                </BulletListItem>
                <BulletListItem>
                    <Translation id="moduleSettings.faq.usbEnabled.4.answer.1" />
                </BulletListItem>
                <BulletListItem>
                    <Translation id="moduleSettings.faq.usbEnabled.4.answer.2" />
                </BulletListItem>
                <BulletListItem>
                    <Translation id="moduleSettings.faq.usbEnabled.4.answer.3" />
                </BulletListItem>
                <BulletListItem>
                    <Translation id="moduleSettings.faq.bluetoothEnabled.android.4.answer.4" />
                </BulletListItem>
            </AccordionItemList>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.5.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.usbEnabled.5.answer" />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.6.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.usbEnabled.6.answer" />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.usbEnabled.7.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.usbEnabled.7.answer" />
            </AccordionItemText>
        ),
    },
];

const getIosFaqItems = (coinLabel: string) => [
    {
        title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.0.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.0.answer" />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.1.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.1.answer" />
            </AccordionItemText>
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
            <AccordionItemText>
                <Translation
                    id="moduleSettings.faq.bluetoothEnabled.ios.2.answer"
                    values={{
                        coinLabel,
                    }}
                />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.question" />,
        content: (
            <VStack spacing="sp4">
                <AccordionItemText>
                    <Translation id="moduleSettings.faq.bluetoothEnabled.ios.5.answer" />
                </AccordionItemText>
                <AccordionItemList>
                    <BulletListItem>
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.0" />
                    </BulletListItem>
                    <BulletListItem>
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.1" />
                    </BulletListItem>
                    <BulletListItem>
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.2" />
                    </BulletListItem>
                    <BulletListItem>
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.3" />
                    </BulletListItem>
                    <BulletListItem>
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.4" />
                    </BulletListItem>
                    <BulletListItem>
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.5" />
                    </BulletListItem>
                    <BulletListItem>
                        <Translation id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.6" />
                    </BulletListItem>
                </AccordionItemList>
                <AccordionItemText>
                    <Translation
                        id="moduleSettings.faq.bluetoothEnabled.ios.3.answer.footer"
                        values={{
                            link: chunk => (
                                <Link
                                    label={chunk}
                                    textVariant="body-sm"
                                    href={`${TREZOR_SUPPORT_BLUETOOTH_TROUBLESHOOTING}#open-chat`}
                                    isUnderlined
                                />
                            ),
                        }}
                    />
                </AccordionItemText>
            </VStack>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.4.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.4.answer" />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.5.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.5.answer" />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.6.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.6.answer" />
            </AccordionItemText>
        ),
    },
    {
        title: <Translation id="moduleSettings.faq.bluetoothEnabled.ios.7.question" />,
        content: (
            <AccordionItemText>
                <Translation id="moduleSettings.faq.bluetoothEnabled.ios.7.answer" />
            </AccordionItemText>
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
                    <AccordionItemText>
                        <Translation
                            id="moduleSettings.faq.trading.answer"
                            values={{
                                link: chunk => (
                                    <Link
                                        label={chunk}
                                        textVariant="body-sm"
                                        href={TREZOR_SUPPORT_TRADING_URL}
                                        isUnderlined
                                    />
                                ),
                            }}
                        />
                    </AccordionItemText>
                ),
            });
        }

        return itemsData;
    }, [coinLabel, isTradingEnabled]);

    return (
        <Card>
            <AccordionList items={items} />
        </Card>
    );
};
