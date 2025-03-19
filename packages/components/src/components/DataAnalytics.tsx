import { ReactNode, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { Center, Column, Icon, List, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Card } from './Card/Card';
import { Button } from './buttons/Button/Button';
import { Switch } from './form/Switch/Switch';

interface DataAnalyticsProps {
    onConfirm: (trackingEnabled: boolean) => void;
    analyticsLink?: (chunks: ReactNode[]) => JSX.Element;
    tosLink?: (chunks: ReactNode[]) => JSX.Element;
    className?: string;
    isInitialTrackingEnabled?: boolean;
}

// This component is used in connect-ui, therefore it's located in this library,
// although in the future it should be moved elsewhere.
export const DataAnalytics = ({
    onConfirm,
    analyticsLink,
    tosLink,
    className,
    isInitialTrackingEnabled = true,
}: DataAnalyticsProps) => {
    const [trackingEnabled, setTrackingEnabled] = useState<boolean>(isInitialTrackingEnabled);

    return (
        <Card
            data-testid="@analytics/consent"
            className={className}
            paddingType="large"
            maxWidth={550}
        >
            <Column gap={spacings.md}>
                <Column gap={spacings.md}>
                    <Text typographyStyle="callout" data-testid="@analytics/consent/heading">
                        <FormattedMessage
                            id="TR_ONBOARDING_DATA_COLLECTION_HEADING"
                            defaultMessage="Anonymous data collection"
                        />
                    </Text>
                    <Text typographyStyle="label" variant="tertiary">
                        <FormattedMessage
                            id="TR_ONBOARDING_DATA_COLLECTION_DESCRIPTION"
                            values={{
                                analytics: analyticsLink || (chunks => chunks),
                                tos: tosLink || (chunks => chunks),
                            }}
                            defaultMessage="All data is anonymous and is used only for product development purposes. Read more in our <analytics>technical documentation</analytics> and <tos>Terms & Conditions</tos>."
                        />
                    </Text>

                    <Card>
                        <Column gap={spacings.lg}>
                            <List gap={spacings.md}>
                                <List.Item bulletComponent={<Icon size="medium" name="eyeSlash" />}>
                                    <Column gap={spacings.xxxs} flex="1">
                                        <Text typographyStyle="callout">
                                            <FormattedMessage
                                                id="TR_ALLOW_ANALYTICS_PRIVACY_TITLE"
                                                defaultMessage="You data is private"
                                            />
                                        </Text>
                                        <Text typographyStyle="label" variant="tertiary">
                                            <FormattedMessage
                                                id="TR_ALLOW_ANALYTICS_PRIVACY_DESCRIPTION"
                                                defaultMessage="We don't gather sensitive personal data like balances, transactions, or profile details."
                                            />
                                        </Text>
                                    </Column>
                                </List.Item>
                                <List.Item bulletComponent={<Icon size="medium" name="bug" />}>
                                    <Column gap={spacings.xxxs} flex="1">
                                        <Text typographyStyle="callout">
                                            <FormattedMessage
                                                id="TR_WHAT_DATA_WE_COLLECT"
                                                defaultMessage="What data do we collect"
                                            />
                                        </Text>
                                        <Text typographyStyle="label" variant="tertiary">
                                            <FormattedMessage
                                                id="TR_ALLOW_ANALYTICS_WHAT_WE_COLLECT_DESCRIPTION"
                                                defaultMessage="We collect data on app performance, user interaction, and potential technical issues to enhance the user experience."
                                            />
                                        </Text>
                                    </Column>
                                </List.Item>
                            </List>

                            <Card paddingType="small">
                                <Row justifyContent="space-between">
                                    <Text typographyStyle="callout">
                                        <FormattedMessage
                                            id="TR_ONBOARDING_ALLOW_ANALYTICS"
                                            defaultMessage="Help us anonymously"
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
                    >
                        <FormattedMessage id="TR_CONFIRM" defaultMessage="Confirm" />
                    </Button>
                </Center>
            </Column>
        </Card>
    );
};
