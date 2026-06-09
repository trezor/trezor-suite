import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { UpdateState } from '@suite/desktop-update';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { isDevEnv } from '@suite-common/suite-utils';
import { Box, Column, Icon, IconCircle, Paragraph, Row } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { TREZOR_FORUM_URL } from '@trezor/urls';

import { setView } from 'src/actions/suite/guideActions';
import {
    GuideContent,
    GuideHeader,
    GuideSectionHeadline,
    GuideViewWrapper,
} from 'src/components/guide';
import { SupportConsentPopover } from 'src/components/guide/SupportConsentPopover';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { GuideItem } from './GuideItem';

export const SupportFeedbackSelection = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const appUpToDate =
        isDesktop() &&
        [UpdateState.Checking, UpdateState.NotAvailable].includes(desktopUpdate.state);

    const firmwareUpToDate = device?.firmware === 'valid';
    const firmwareVersion = device?.features ? (
        getFirmwareVersion(device) || <Translation id="TR_DEVICE_FW_UNKNOWN" />
    ) : (
        <Translation id="TR_DEVICE_NOT_CONNECTED" />
    );

    const goBack = () => dispatch(setView('GUIDE_DEFAULT'));
    const handleBugButtonClick = () => {
        dispatch(setView('FEEDBACK_BUG'));
        analytics.report({
            type: events.guideFeedbackNavigationEvent.name,
            payload: { type: 'bug' },
        });
    };
    const handleFeedbackButtonClick = () => {
        dispatch(setView('FEEDBACK_SUGGESTION'));
        analytics.report({
            type: events.guideFeedbackNavigationEvent.name,
            payload: { type: 'suggestion' },
        });
    };

    return (
        <GuideViewWrapper>
            <GuideHeader
                back={goBack}
                label={<Translation id="TR_GUIDE_VIEW_HEADLINES_SUPPORT_FEEDBACK_SELECTION" />}
            />
            <GuideContent>
                <Box margin={{ bottom: 16 }}>
                    <GuideSectionHeadline id="TR_GUIDE_VIEW_HEADLINE_HELP_US_IMPROVE" />
                    <Column gap={12}>
                        <GuideItem
                            onClick={handleBugButtonClick}
                            data-testid="@guide/feedback/bug"
                            icon={<IconCircle name="lifebuoy" size={32} intent="neutral" />}
                        >
                            <Column gap={4} justifyContent="space-between">
                                <Translation id="TR_BUG" />
                                <Paragraph
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_GUIDE_BUG_LABEL" />
                                </Paragraph>
                            </Column>
                        </GuideItem>
                        <GuideItem
                            onClick={handleFeedbackButtonClick}
                            data-testid="@guide/feedback/suggestion"
                            icon={<IconCircle name="megaphone" size={32} intent="neutral" />}
                        >
                            <Column gap={4} justifyContent="space-between">
                                <Translation id="TR_SUGGESTION" />
                                <Paragraph
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_GUIDE_SUGGESTION_LABEL" />
                                </Paragraph>
                            </Column>
                        </GuideItem>
                    </Column>
                </Box>

                <Box>
                    <GuideSectionHeadline id="TR_GUIDE_VIEW_HEADLINE_NEED_HELP" />
                    <Column gap={12}>
                        <SupportConsentPopover>
                            <GuideItem onClick={() => {}} data-testid="@guide/support">
                                <Row gap={8} justifyContent="space-between">
                                    <Translation id="TR_GUIDE_SUPPORT" />
                                    <Icon name="arrowLineUpRight" size={20} />
                                </Row>
                            </GuideItem>
                        </SupportConsentPopover>

                        <GuideItem
                            onClick={() => window.open(TREZOR_FORUM_URL, '_blank')}
                            data-testid="@guide/forum"
                        >
                            <Row gap={8} justifyContent="space-between">
                                <Translation id="TR_GUIDE_FORUM" />
                                <Icon name="arrowLineUpRight" size={20} />
                            </Row>
                        </GuideItem>
                    </Column>
                </Box>

                <Row
                    gap={16}
                    margin={{ top: 20 }}
                    alignItems="center"
                    justifyContent="space-around"
                >
                    <Paragraph
                        data-testid="@guide/support/version"
                        typographyStyle="body-xs"
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="TR_APP" />
                        :&nbsp;
                        {!isDevEnv && appUpToDate ? (
                            <>
                                <Icon
                                    size={12}
                                    margin={{ horizontal: 4 }}
                                    name="check"
                                    intent="neutral"
                                    priority="secondary"
                                />
                                <Translation id="TR_UP_TO_DATE" />
                            </>
                        ) : (
                            <>
                                {process.env.VERSION}
                                {isDevEnv && '-dev'}
                            </>
                        )}
                    </Paragraph>
                    <Paragraph
                        data-testid="@guide/support/firmware"
                        typographyStyle="body-xs"
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="TR_FIRMWARE" />
                        :&nbsp;
                        {firmwareUpToDate ? (
                            <>
                                <Icon
                                    size={12}
                                    margin={{ horizontal: 4 }}
                                    name="check"
                                    intent="neutral"
                                    priority="secondary"
                                />
                                <Translation id="TR_UP_TO_DATE" />
                            </>
                        ) : (
                            firmwareVersion
                        )}
                    </Paragraph>
                </Row>
            </GuideContent>
        </GuideViewWrapper>
    );
};
