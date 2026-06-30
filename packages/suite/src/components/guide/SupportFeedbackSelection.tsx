import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { UpdateState } from '@suite/desktop-update';
import { Translation, type TranslationKey } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { isDevEnv } from '@suite-common/suite-utils';
import { Box, CardList, Column, Icon, IconCircle, Row, Text } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import {
    ArrowLineUpRightIcon,
    BugBeetleIcon,
    CaretRightIcon,
    ChatsIcon,
    LifebuoyIcon,
    MegaphoneIcon,
} from '@trezor/icons';
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

const StatusText = ({ id }: { id: TranslationKey }) => (
    <Text typographyStyle="body-sm" intent="neutral" priority="secondary" as="div">
        <Translation id={id} />
    </Text>
);

export const SupportFeedbackSelection = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const appUpToDate =
        isDesktop() &&
        [UpdateState.Checking, UpdateState.NotAvailable].includes(desktopUpdate.state);
    const appUpdateAvailable =
        isDesktop() &&
        [UpdateState.Available, UpdateState.Downloading, UpdateState.Ready].includes(
            desktopUpdate.state,
        );
    const appVersion = `${process.env.VERSION}${isDevEnv ? '-dev' : ''}`;

    const isDeviceConnected = !!device?.features;
    const firmwareUpToDate = device?.firmware === 'valid';
    const getFirmwareVersionLabel = () => {
        if (!device?.features) {
            return '-/-';
        }

        const version = getFirmwareVersion(device);

        if (!version) {
            return <Translation id="TR_DEVICE_FW_UNKNOWN" />;
        }

        return <Translation id="TR_YOUR_CURRENT_VERSION" values={{ version }} />;
    };

    const getAppStatusId = (): TranslationKey | null => {
        if (appUpToDate) {
            return 'TR_UP_TO_DATE';
        }

        if (appUpdateAvailable) {
            return 'TR_UPDATE_AVAILABLE';
        }

        return null;
    };

    const getFirmwareStatusId = (): TranslationKey | null => {
        if (firmwareUpToDate) {
            return 'TR_UP_TO_DATE';
        }

        if (!isDeviceConnected) {
            return 'TR_GUIDE_SUPPORT_DEVICE_DISCONNECTED';
        }

        return null;
    };

    const appStatusId = getAppStatusId();
    const firmwareStatusId = getFirmwareStatusId();

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
                                        <IconCircle
                                            icon={BugBeetleIcon}
                                            size={32}
                                            intent="neutral"
                                        />
                                        <Column alignItems="flex-start" overflow="hidden">
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
                                        as={CaretRightIcon}
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
                                        <IconCircle
                                            icon={MegaphoneIcon}
                                            size={32}
                                            intent="neutral"
                                        />
                                        <Column alignItems="flex-start" overflow="hidden">
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
                                        as={CaretRightIcon}
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
                                                icon={LifebuoyIcon}
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
                                            as={ArrowLineUpRightIcon}
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
                                        <IconCircle icon={ChatsIcon} size={32} intent="neutral" />
                                        <Text typographyStyle="body-md" as="div" maxWidth="100%">
                                            <Translation id="TR_GUIDE_FORUM" />
                                        </Text>
                                    </Row>
                                    <Icon
                                        as={ArrowLineUpRightIcon}
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
                            <Row justifyContent="space-between" width="100%" alignItems="flex-end">
                                <Column alignItems="flex-start" overflow="hidden">
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
                                {!!appStatusId && <StatusText id={appStatusId} />}
                            </Row>
                        </CardList.Item>
                        <CardList.Item data-testid="@guide/support/firmware" paddingType="medium">
                            <Row justifyContent="space-between" width="100%" alignItems="flex-end">
                                <Column alignItems="flex-start" overflow="hidden">
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
                                {!!firmwareStatusId && <StatusText id={firmwareStatusId} />}
                            </Row>
                        </CardList.Item>
                    </CardList>
                </Column>
            </GuideContent>
        </GuideViewWrapper>
    );
};
