import { ReactNode, useState } from 'react';

import {
    Banner,
    BannerIntent,
    Box,
    Button,
    Card,
    Column,
    IconName,
    Modal,
    Row,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TroubleshootingTipsList } from './TroubleshootingTipsList';
import { useLayoutSize } from '../../../hooks/suite';
import { Translation } from '../Translation';
import { TroubleshootingTipsFooter } from './TroubleshootingTipsFooter';

export type TroubleshootingTipsItem = {
    key: string;
    heading?: ReactNode;
    description?: ReactNode;
    hide?: boolean;
    icon?: IconName;
};

type TroubleshootingTipsBaseProps = {
    label?: ReactNode;
    ctaLabel?: ReactNode;
    cta?: ReactNode;
    initiallyIsOpen?: boolean;
    'data-testid'?: string;
    toggleText?: ReactNode;
    intent?: BannerIntent;
    items: TroubleshootingTipsItem[];
};

export const TroubleshootingTips = ({
    label,
    items,
    cta,
    ctaLabel,
    initiallyIsOpen,
    toggleText,
    intent = 'warning',
    'data-testid': dataTest,
}: TroubleshootingTipsBaseProps) => {
    // @TODO isn't `labelRow` duplicate information? If not, where to show it?
    const labelRow =
        label !== undefined ? (
            <Row
                justifyContent="space-between"
                alignItems="center"
                margin={{ horizontal: spacings.sm }}
            >
                <Text typographyStyle="body">{label}</Text>
            </Row>
        ) : null;

    const ActionBanner = () => {
        const { isBelowMobile } = useLayoutSize();

        return (
            <Banner rightContent={cta} intent={intent} minWidth={isBelowMobile ? undefined : 400}>
                {ctaLabel ?? label}
            </Banner>
        );
    };

    // todo: this filter is duplicated with TroubleshootingTipsList
    const visibleTips = items.filter(item => !item.hide);

    const TroubleshootingButton = () => {
        const [isTroubleshootingModalVisible, setIsTroubleshootingModalVisible] = useState(false);
        const onOpen = () => {
            setIsTroubleshootingModalVisible(true);
        };
        const onCancel = () => {
            setIsTroubleshootingModalVisible(false);
        };

        return (
            <Column
                alignItems="center"
                data-testid={dataTest || '@onboarding/troubleshooting-tips'}
            >
                <Button
                    onClick={onOpen}
                    intent="neutral"
                    size="small"
                    priority={!initiallyIsOpen ? 'secondary' : 'primary'}
                    iconLeft="question"
                    data-testid="@onboarding/troubleshooting-tips/button"
                >
                    {toggleText ?? <Translation id="TR_TROUBLE_SHOOTING_TIPS" />}
                </Button>

                {isTroubleshootingModalVisible && (
                    <Modal
                        heading={toggleText ?? <Translation id="TR_TROUBLE_SHOOTING_TIPS" />}
                        onCancel={onCancel}
                        variant="info"
                        bottomContent={<TroubleshootingTipsFooter />}
                        data-testid="@onboarding/troubleshooting-tips/modal"
                    >
                        <Card header={labelRow}>
                            <TroubleshootingTipsList items={visibleTips} />
                        </Card>
                    </Modal>
                )}
            </Column>
        );
    };

    return cta ? (
        <Column gap={80} alignItems="center">
            <ActionBanner />
            {visibleTips.length > 0 && <TroubleshootingButton />}
        </Column>
    ) : (
        <Box margin={{ top: 80 }}>{visibleTips.length > 0 && <TroubleshootingButton />}</Box>
    );
};
