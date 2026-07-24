import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, Column, Divider, Icon, IconCircle, Row, Text } from '@trezor/components';
import { CheckCircleFilledIcon, CheckIcon } from '@trezor/icons';

import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

import { useNavigateToAccountRoute } from './useNavigateToAccountRoute';

type WrappedNativeFlowCompleteProps = {
    account: Account;
    heading: ReactNode;
    description: ReactNode;
    children?: ReactNode;
};

export const WrappedNativeFlowComplete = ({
    account,
    heading,
    description,
    children,
}: WrappedNativeFlowCompleteProps) => {
    const { isBelowMobile } = useLayoutSize();
    const navigateToOverview = useNavigateToAccountRoute(account, 'wallet-tokens');

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

            <Button intent="neutral" priority="secondary" onClick={navigateToOverview}>
                <Translation id="TR_EARN_YIELD_BACK_TO_OVERVIEW" />
            </Button>
        </Column>
    );
};
