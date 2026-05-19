import { type ReactNode, useEffect, useRef, useState } from 'react';

import { Translation } from '@suite/intl';
import { selectIsAnalyticsEnabled } from '@suite-common/analytics-redux';
import { selectSupportChatUrl } from '@suite-common/support';
import {
    Button,
    Card,
    Checkbox,
    Column,
    Paragraph,
    Popover,
    type PopoverRef,
    variables,
} from '@trezor/components';
import { spacingsPx, zIndices } from '@trezor/theme';

import { setSupportConsentAutoOpen } from 'src/actions/suite/guideActions';
import { GUIDE_ANIMATION_DURATION_MS } from 'src/hooks/guide/useGuide';
import { useDispatch, useSelector } from 'src/hooks/suite';

// To match the width of the trigger button in the SupportFeedbackSelection component.
const POPOVER_WIDTH = `calc(${variables.LAYOUT_SIZE.GUIDE_PANEL_CONTENT_WIDTH} - 2 * ${spacingsPx.lg})`;

type SupportConsentPopoverProps = {
    children: ReactNode;
};

export const SupportConsentPopover = ({ children }: SupportConsentPopoverProps) => {
    const dispatch = useDispatch();
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);
    const autoOpen = useSelector(state => state.guide.supportConsentAutoOpen);
    const [isSystemInfoShared, setIsSystemInfoShared] = useState(
        autoOpen?.shareSystemInfo ?? isAnalyticsEnabled,
    );
    const supportChatUrl = useSelector(state => selectSupportChatUrl(state, isSystemInfoShared));
    const popoverRef = useRef<PopoverRef>(null);

    useEffect(() => {
        if (!autoOpen) return;

        setIsSystemInfoShared(autoOpen.shareSystemInfo);
        // Wait for the guide panel slide-in to finish so the popover doesn't
        // fly in before the panel has arrived.
        const timeoutId = setTimeout(() => {
            popoverRef.current?.open();
            dispatch(setSupportConsentAutoOpen(null));
        }, GUIDE_ANIMATION_DURATION_MS);

        return () => clearTimeout(timeoutId);
    }, [autoOpen, dispatch]);

    return (
        <Popover
            ref={popoverRef}
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
                            iconRight="arrowUpRight"
                            onClick={() => window.open(supportChatUrl, '_blank')}
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
