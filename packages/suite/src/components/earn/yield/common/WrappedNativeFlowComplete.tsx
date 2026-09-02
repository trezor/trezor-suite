import { type ReactNode } from 'react';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, Column, Divider, Icon, IconCircle, Row, Text } from '@trezor/components';
import { CheckCircleFilledIcon, CheckIcon } from '@trezor/icons';

import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

import { useNavigateToAccountRoute } from './useNavigateToAccountRoute';

type WrappedNativeFlowCompleteProps = {
    account: Account;
    flow: WrappedNativeFlowType;
    heading: ReactNode;
    description: ReactNode;
    children?: ReactNode;
};

export const WrappedNativeFlowComplete = ({
    account,
    flow,
    heading,
    description,
    children,
}: WrappedNativeFlowCompleteProps) => {
    const { isBelowMobile } = useLayoutSize();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const navigateToOverview = useNavigateToAccountRoute(account, 'wallet-tokens');

    const handleBackToOverview = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: flow === 'wrap' ? 'wrap-form' : 'unwrap-form',
                to: 'account-detail',
                networkSymbol: account.symbol,
            },
        });
        navigateToOverview();
    };

    return (
        <Column gap={16}>
            <IconCircle icon={CheckIcon} intent="brand" size={isBelowMobile ? 64 : 96} />

            <Column gap={4}>
                <Text typographyStyle="headline-md">{heading}</Text>

                <Text intent="neutral" priority="secondary">
                    {description}
                </Text>
            </Column>

            <Card type="contrast" paddingType="none">
                <Column gap={0}>
                    <Row
                        justifyContent="space-between"
                        alignItems="center"
                        padding={{ vertical: 16, horizontal: 20 }}
                    >
                        <Text typographyStyle="body-md">
                            <Translation id="TR_EARN_YIELD_STATUS" />
                        </Text>
                        <Row alignItems="center" gap={8}>
                            <Icon as={CheckCircleFilledIcon} intent="brand" />
                            <Text typographyStyle="body-md" intent="brand">
                                <Translation id="TR_EARN_YIELD_COMPLETED" />
                            </Text>
                        </Row>
                    </Row>

                    {children && (
                        <>
                            <Divider color="borderNeutral" margin={0} />
                            {children}
                        </>
                    )}
                </Column>
            </Card>

            <Button intent="neutral" priority="secondary" onClick={handleBackToOverview}>
                <Translation id="TR_EARN_YIELD_BACK_TO_OVERVIEW" />
            </Button>
        </Column>
    );
};
