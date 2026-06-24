import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { UpdateState } from '@suite/desktop-update';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { isDevEnv } from '@suite-common/suite-utils';
import { Box, CardList, Column, Icon, IconCircle, Row, Text } from '@trezor/components';
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

export const SupportFeedbackSelection = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const appUpToDate =
        isDesktop() &&
        [UpdateState.Checking, UpdateState.NotAvailable].includes(desktopUpdate.state);
    const appVersion = `${process.env.VERSION}${isDevEnv ? '-dev' : ''}`;

    const firmwareUpToDate = device?.firmware === 'valid';
    const getFirmwareVersionLabel = () => {
        if (!device?.features) {
            return <Translation id="TR_DEVICE_NOT_CONNECTED" />;
        }

        const version = getFirmwareVersion(device);

        if (!version) {
            return <Translation id="TR_DEVICE_FW_UNKNOWN" />;
        }

        return <Translation id="TR_YOUR_CURRENT_VERSION" values={{ version }} />;
    };

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
                <Column justifyContent="space-between" height="100%">
                    <Box flex="1">
                        <Box margin={{ bottom: 16 }}>
                            <GuideSectionHeadline id="TR_GUIDE_VIEW_HEADLINE_HELP_US_IMPROVE" />
                            <CardList>
                                <CardList.Item
                                    paddingType="medium"
                                    onClick={handleBugButtonClick}
                                    data-testid="@guide/feedback/bug"
                                >
                                    <Row gap={16} flex="1" overflow="hidden">
                                        <IconCircle name="bugBeetle" size={32} intent="neutral" />
                                        <Column gap={4} alignItems="flex-start" overflow="hidden">
                                            <Text
                                                typographyStyle="body-md"
                                                as="div"
                                                maxWidth="100%"
                                            >
                                                <Translation id="TR_BUG" />
                                            </Text>
                                            <Text
                                                typographyStyle="body-sm"
                                                intent="neutral"
                                                priority="secondary"
                                                as="div"
                                                maxWidth="100%"
                                            >
                                                <Translation id="TR_GUIDE_BUG_LABEL" />
                                            </Text>
                                        </Column>
                                    </Row>
                                    <Icon
                                        name="caretRight"
                                        size={20}
                                        intent="neutral"
                                        priority="secondary"
                                    />
                                </CardList.Item>
                                <CardList.Item
                                    paddingType="medium"
                                    onClick={handleFeedbackButtonClick}
                                    data-testid="@guide/feedback/suggestion"
                                >
                                    <Row gap={16} flex="1" overflow="hidden">
                                        <IconCircle name="megaphone" size={32} intent="neutral" />
                                        <Column gap={4} alignItems="flex-start" overflow="hidden">
                                            <Text
                                                typographyStyle="body-md"
                                                as="div"
                                                maxWidth="100%"
                                            >
                                                <Translation id="TR_SUGGESTION" />
                                            </Text>
                                            <Text
                                                typographyStyle="body-sm"
                                                intent="neutral"
                                                priority="secondary"
                                                as="div"
                                                maxWidth="100%"
                                            >
                                                <Translation id="TR_GUIDE_SUGGESTION_LABEL" />
                                            </Text>
                                        </Column>
                                    </Row>
                                    <Icon
                                        name="caretRight"
                                        size={20}
                                        intent="neutral"
                                        priority="secondary"
                                    />
                                </CardList.Item>
                            </CardList>
                        </Box>

                        <Box>
                            <GuideSectionHeadline id="TR_GUIDE_VIEW_HEADLINE_NEED_HELP" />
                            <CardList>
                                <SupportConsentPopover>
                                    <CardList.Item
                                        paddingType="medium"
                                        onClick={() => {}}
                                        data-testid="@guide/support"
                                        width="100%"
                                    >
                                        <Row gap={16} flex="1" overflow="hidden">
                                            <IconCircle
                                                name="lifebuoy"
                                                size={32}
                                                intent="neutral"
                                            />
                                            <Text
                                                typographyStyle="body-md"
                                                as="div"
                                                maxWidth="100%"
                                            >
                                                <Translation id="TR_GUIDE_SUPPORT" />
                                            </Text>
                                        </Row>
                                        <Icon
                                            name="arrowLineUpRight"
                                            size={20}
                                            intent="neutral"
                                            priority="secondary"
                                        />
                                    </CardList.Item>
                                </SupportConsentPopover>

                                <CardList.Item
                                    paddingType="medium"
                                    onClick={() => window.open(TREZOR_FORUM_URL, '_blank')}
                                    data-testid="@guide/forum"
                                >
                                    <Row gap={16} flex="1" overflow="hidden">
                                        <IconCircle name="chats" size={32} intent="neutral" />
                                        <Text typographyStyle="body-md" as="div" maxWidth="100%">
                                            <Translation id="TR_GUIDE_FORUM" />
                                        </Text>
                                    </Row>
                                    <Icon
                                        name="arrowLineUpRight"
                                        size={20}
                                        intent="neutral"
                                        priority="secondary"
                                    />
                                </CardList.Item>
                            </CardList>
                        </Box>
                    </Box>
                    <CardList margin={{ bottom: 16 }}>
                        <CardList.Item data-testid="@guide/support/version" paddingType="medium">
                            <Column gap={4} alignItems="flex-start" overflow="hidden">
                                <Text typographyStyle="body-md" as="div" maxWidth="100%">
                                    <Translation id="TR_APPLICATION" />
                                </Text>
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    as="div"
                                    maxWidth="100%"
                                >
                                    <Translation
                                        id="TR_YOUR_CURRENT_VERSION"
                                        values={{ version: appVersion }}
                                    />
                                </Text>
                            </Column>
                            {appUpToDate && (
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    as="div"
                                >
                                    <Translation id="TR_UP_TO_DATE" />
                                </Text>
                            )}
                        </CardList.Item>
                        <CardList.Item data-testid="@guide/support/firmware" paddingType="medium">
                            <Column gap={4} alignItems="flex-start" overflow="hidden">
                                <Text typographyStyle="body-md" as="div" maxWidth="100%">
                                    <Translation id="TR_FIRMWARE" />
                                </Text>
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    as="div"
                                    maxWidth="100%"
                                >
                                    {getFirmwareVersionLabel()}
                                </Text>
                            </Column>
                            {firmwareUpToDate && (
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    as="div"
                                >
                                    <Translation id="TR_UP_TO_DATE" />
                                </Text>
                            )}
                        </CardList.Item>
                    </CardList>
                </Column>
            </GuideContent>
        </GuideViewWrapper>
    );
};
