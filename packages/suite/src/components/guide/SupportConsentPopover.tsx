import { type ReactNode, useState } from 'react';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { selectIsAnalyticsEnabled } from '@suite-common/analytics-redux';
import { useServices } from '@suite-common/dependency-injection';
import { selectSupportChatUrl } from '@suite-common/support';
import { Button, Card, Checkbox, Column, Paragraph, Popover, variables } from '@trezor/components';
import { ArrowLineUpRightIcon } from '@trezor/icons';
import { zIndices } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

// To match the width of the trigger button in the SupportFeedbackSelection component at minimum guide width.
const POPOVER_WIDTH = `calc(${variables.LAYOUT_SIZE.GUIDE_PANEL_DEFAULT_WIDTH}px - 33px)`;

type SupportConsentPopoverProps = {
    children: ReactNode;
};

export const SupportConsentPopover = ({ children }: SupportConsentPopoverProps) => {
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);
    const [isSystemInfoShared, setIsSystemInfoShared] = useState(isAnalyticsEnabled);
    const supportChatUrl = useSelector(state => selectSupportChatUrl(state, isSystemInfoShared));
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const handleOpenSupportChat = () => {
        analytics.report({
            type: events.guideSupportChatOpenedEvent.name,
            payload: { systemInfoShared: isSystemInfoShared, platform: 'desktop' },
        });
        window.open(supportChatUrl, '_blank');
    };

    return (
        <Popover
            zIndex={zIndices.guide}
            popoverOffset={-5}
            placement={{ position: 'bottom', alignment: 'start' }}
            content={
                <Card paddingType="small" width={POPOVER_WIDTH}>
                    <Column gap={12}>
                        <Paragraph typographyStyle="body-md" intent="neutral">
                            <Translation id="TR_GUIDE_SUPPORT_CONSENT_TITLE" />
                        </Paragraph>
                        <Column gap={8}>
                            <Card paddingType="small">
                                <Checkbox
                                    isChecked={isSystemInfoShared}
                                    onChange={() => setIsSystemInfoShared(prev => !prev)}
                                    data-testid="@guide/support/share-system-info"
                                >
                                    <Translation id="TR_GUIDE_SUPPORT_CONSENT_TOGGLE" />
                                </Checkbox>
                            </Card>
                            <Paragraph
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation id="TR_GUIDE_SUPPORT_CONSENT_DESCRIPTION" />
                            </Paragraph>
                        </Column>
                        <Button
                            iconRight={ArrowLineUpRightIcon}
                            onClick={handleOpenSupportChat}
                            width="100%"
                        >
                            <Translation id="TR_GUIDE_SUPPORT_CONSENT_BUTTON" />
                        </Button>
                    </Column>
                </Card>
            }
        >
            {children}
        </Popover>
    );
};
