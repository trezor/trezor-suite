import { type JSX, type ReactNode, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Button, Card, Center, Column, Icon, List, Row, Switch, Text } from '@trezor/components';
import { BugIcon, EyeSlashIcon } from '@trezor/icons';
type DataAnalyticsProps = {
    onConfirm: (trackingEnabled: boolean) => void;
    analyticsLink?: (chunks: ReactNode[]) => JSX.Element;
    tosLink?: (chunks: ReactNode[]) => JSX.Element;
    isInitialTrackingEnabled?: boolean;
};

export const DataAnalytics = ({
    onConfirm,
    analyticsLink,
    tosLink,
    isInitialTrackingEnabled = true,
}: DataAnalyticsProps) => {
    const [trackingEnabled, setTrackingEnabled] = useState<boolean>(isInitialTrackingEnabled);

    return (
        <Card data-testid="@analytics/consent" paddingType="large" maxWidth={550}>
            <Column gap={16}>
                <Column gap={16}>
                    <Text typographyStyle="body-sm-strong" data-testid="@analytics/consent/heading">
                        <FormattedMessage
                            id="TR_SUITEDARK_PRIVACY_HEADING"
                            defaultMessage="Privacy-preserving build"
                        />
                    </Text>
                    <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <FormattedMessage
                            id="TR_SUITEDARK_PRIVACY_DESCRIPTION"
                            values={{
                                analytics: analyticsLink || (chunks => chunks),
                                tos: tosLink || (chunks => chunks),
                            }}
                            defaultMessage="You're using a special privacy-preserving build of Trezor Suite. Telemetry is disabled at build time — nothing is collected or sent anywhere. Everything else works exactly as you're used to."
                        />
                    </Text>

                    <Card type="contrast">
                        <Column gap={20}>
                            <List gap={16}>
                                <List.Item bulletComponent={<Icon size={16} as={EyeSlashIcon} />}>
                                    <Column gap={2} flex="1">
                                        <Text typographyStyle="body-sm-strong">
                                            <FormattedMessage
                                                id="TR_SUITEDARK_PRIVACY_ITEM_TITLE"
                                                defaultMessage="Your data stays yours"
                                            />
                                        </Text>
                                        <Text
                                            typographyStyle="body-xs"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            <FormattedMessage
                                                id="TR_SUITEDARK_PRIVACY_ITEM_DESCRIPTION"
                                                defaultMessage="No analytics, no error reporting, no remote tracking — all removed from this build."
                                            />
                                        </Text>
                                    </Column>
                                </List.Item>
                                <List.Item bulletComponent={<Icon size={16} as={BugIcon} />}>
                                    <Column gap={2} flex="1">
                                        <Text typographyStyle="body-sm-strong">
                                            <FormattedMessage
                                                id="TR_SUITEDARK_WHAT_WE_COLLECT"
                                                defaultMessage="What we collect"
                                            />
                                        </Text>
                                        <Text
                                            typographyStyle="body-xs"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            <FormattedMessage
                                                id="TR_SUITEDARK_WHAT_WE_COLLECT_DESCRIPTION"
                                                defaultMessage="Nothing. This build sends no telemetry whatsoever."
                                            />
                                        </Text>
                                    </Column>
                                </List.Item>
                            </List>

                            <Card paddingType="small">
                                <Row justifyContent="space-between">
                                    <Text typographyStyle="body-sm-strong">
                                        <FormattedMessage
                                            id="TR_SUITEDARK_ANALYTICS_TOGGLE"
                                            defaultMessage="Analytics (disabled in this build)"
                                        />
                                    </Text>
                                    <Switch
                                        isChecked={trackingEnabled}
                                        onChange={() => setTrackingEnabled(!trackingEnabled)}
                                        data-testid="@analytics/toggle-switch"
                                        size="small"
                                    />
                                </Row>
                            </Card>
                        </Column>
                    </Card>
                </Column>

                <Center>
                    <Button
                        data-testid="@analytics/continue-button"
                        onClick={() => onConfirm(trackingEnabled)}
                        minWidth={180}
                        size="large"
                    >
                        <FormattedMessage id="TR_CONFIRM" defaultMessage="Confirm" />
                    </Button>
                </Center>
            </Column>
        </Card>
    );
};
