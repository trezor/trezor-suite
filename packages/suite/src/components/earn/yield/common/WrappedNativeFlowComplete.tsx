import { type ReactNode } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Card, Column, Divider, Icon, Row, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CheckCircleFilledIcon } from '@trezor/icons';

import { EarnFlowComplete } from '#src/components/earn/common/EarnFlowComplete';

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
    const { analytics } = useServices(injectDesktopAnalytics);
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
        <EarnFlowComplete heading={heading} description={description} onBack={handleBackToOverview}>
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
        </EarnFlowComplete>
    );
};
