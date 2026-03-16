import { type ReactNode, useState } from 'react';

import { Translation } from '@suite/intl';
import {
    Banner,
    type BannerIntent,
    Box,
    Button,
    Column,
    type IconName,
    Modal,
} from '@trezor/components';

import { TroubleshootingTipsFooter } from './TroubleshootingTipsFooter';
import { TroubleshootingTipsList } from './TroubleshootingTipsList';

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
    toggleText,
    intent = 'warning',
    'data-testid': dataTest,
}: TroubleshootingTipsBaseProps) => {
    // todo: this filter is duplicated with TroubleshootingTipsList
    const visibleTips = items.filter(item => !item.hide);

    const hasOtherCta = Boolean(cta);

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
                    size={hasOtherCta ? 'small' : 'large'}
                    priority={hasOtherCta ? 'secondary' : undefined}
                    iconLeft="question"
                    data-testid="@onboarding/troubleshooting-tips/button"
                >
                    {toggleText ?? <Translation id="TR_TROUBLE_SHOOTING_TIPS" />}
                </Button>

                {isTroubleshootingModalVisible && (
                    <Modal
                        heading={toggleText ?? <Translation id="TR_TROUBLE_SHOOTING_TIPS" />}
                        onCancel={onCancel}
                        intent="info"
                        bottomContent={<TroubleshootingTipsFooter />}
                        data-testid="@onboarding/troubleshooting-tips/modal"
                    >
                        <TroubleshootingTipsList items={visibleTips} />
                    </Modal>
                )}
            </Column>
        );
    };

    return cta ? (
        <Column gap={80} alignItems="center">
            <Banner
                rightContent={cta}
                intent={intent}
                maxWidth={600}
                description={ctaLabel ?? label}
            />
            {visibleTips.length > 0 && <TroubleshootingButton />}
        </Column>
    ) : (
        <Box margin={{ top: 80 }}>{visibleTips.length > 0 && <TroubleshootingButton />}</Box>
    );
};
