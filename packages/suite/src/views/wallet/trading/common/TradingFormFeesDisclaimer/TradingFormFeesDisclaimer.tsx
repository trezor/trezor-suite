import { useState } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import {
    Icon,
    IconCircle,
    type IconName,
    Link,
    List,
    Modal,
    Row,
    Text,
    TextButton,
} from '@trezor/components';
import { TREZOR_SUITE_TOS_URL, TREZOR_SUPPORT_UNDERSTANDING_FEES } from '@trezor/urls';

type ModalItem = {
    textId: TranslationKey;
    subTextId?: TranslationKey;
    icon: IconName;
    url?: string;
};

const MODAL_ITEMS: ModalItem[] = [
    {
        textId: 'TR_HOW_TRADING_COMPARES_PROVIDERS',
        icon: 'piggyBank',
    },
    {
        textId: 'TR_HOW_TRADING_LOCATION_OFFERS',
        icon: 'mapPin',
    },
    {
        textId: 'TR_HOW_TRADING_PRIVACY_KYC',
        subTextId: 'TR_HOW_TRADING_PRIVACY_KYC_SUBTEXT',
        icon: 'identificationCard',
    },
    {
        textId: 'TR_TRADING_FEES_CALCULATION_DISCLAIMER',
        icon: 'percent',
        url: TREZOR_SUPPORT_UNDERSTANDING_FEES,
    },
    {
        textId: 'TR_HOW_TRADING_TERMS_OF_USE',
        icon: 'scroll',
        url: TREZOR_SUITE_TOS_URL,
    },
];

export const TradingFormFeesDisclaimer = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <TextButton
                intent="neutral"
                priority="secondary"
                size="small"
                isUnderlined
                onClick={() => setIsModalOpen(true)}
            >
                <Translation id="TR_HOW_TRADING_WORKS_SHORT" />
            </TextButton>
            {isModalOpen && (
                <Modal
                    onCancel={() => setIsModalOpen(false)}
                    heading={<Translation id="TR_HOW_TRADING_WORKS" />}
                    bottomContent={
                        <Modal.Button onClick={() => setIsModalOpen(false)}>
                            <Translation id="TR_GOT_IT" />
                        </Modal.Button>
                    }
                >
                    <List gap={12} bulletGap={12}>
                        {MODAL_ITEMS.map(item => (
                            <List.Item
                                key={item.textId}
                                bulletComponent={
                                    <IconCircle name={item.icon} size={40} intent="brand" />
                                }
                            >
                                <Text typographyStyle="body-md-strong" color="textDefault">
                                    {item.url ? (
                                        <Row gap={8}>
                                            <Link href={item.url} target="_blank">
                                                <Translation id={item.textId} />
                                            </Link>
                                            <Icon name="arrowSquareOut" size={16} />
                                        </Row>
                                    ) : (
                                        <Translation id={item.textId} />
                                    )}
                                </Text>

                                {item.subTextId && (
                                    <Text typographyStyle="body-sm" color="textSubdued" as="p">
                                        <Translation id={item.subTextId} />
                                    </Text>
                                )}
                            </List.Item>
                        ))}
                    </List>
                </Modal>
            )}
        </>
    );
};
