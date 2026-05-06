import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type EarnParams, goto } from '@suite/router';
import {
    type EarnAnalyticsStep,
    EarnFlow,
    EarnProvider,
} from '@suite-common/suite-types/src/staking';
import { type Account } from '@suite-common/wallet-types';
import { Box, Button, Column, IconButton, Row, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

import { AccountLabel } from 'src/components/suite';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { useAllYieldOpportunities } from '../../dashboard/yield/hooks/useAllYieldOpportunities';

interface YieldPageHeaderProps {
    analyticsStep: Extract<EarnAnalyticsStep, 'yield-supply' | 'yield-withdraw'>;
    account?: Account;
    routeParams?: EarnParams;
}

export const YieldPageHeader = ({ analyticsStep, account, routeParams }: YieldPageHeaderProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const { yieldOpportunities } = useAllYieldOpportunities();
    const vault = routeParams
        ? yieldOpportunities.find(opportunity => opportunity.id === routeParams.yieldId)
        : undefined;
    const vaultName = vault?.outputToken?.name;
    const networkSymbol = account?.symbol;

    const onBackClick = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: (() => {
                    switch (analyticsStep) {
                        case 'yield-supply':
                            return 'supply-form';
                        case 'yield-withdraw':
                            return 'withdraw-form';
                    }
                })(),
                to: 'earn-dashboard',
                networkSymbol: account?.symbol,
            },
        });

        dispatch(goto({ routeName: 'suite-earn' }));
    };

    const onHowItWorksClick = () => {
        if (!account || !routeParams) {
            return;
        }

        dispatch(
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Yield,
                provider: EarnProvider.Morpho,
                account,
                analyticsStep,
                actionType: 'close',
                yieldContext: {
                    id: routeParams.yieldId,
                    tokenContractAddress: vault?.token.address ?? undefined,
                },
            }),
        );
    };

    return (
        <PageHeader>
            <Row width="100%" gap={16} alignItems="center">
                <IconButton
                    icon="caretLeft"
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={onBackClick}
                    data-testid="@account-subpage/back"
                />

                {vaultName ? (
                    <Row alignItems="center" gap={12} overflow="hidden">
                        {networkSymbol && (
                            <AssetLogo
                                placeholder={vault?.token?.symbol || vault?.token?.name || ''}
                                symbol={networkSymbol}
                                contractAddress={vault?.token?.address}
                                showNetworkIcon
                                size={32}
                            />
                        )}
                        <Column gap={2} overflow="hidden">
                            <Text typographyStyle="body-md-strong" ellipsisLineCount={1}>
                                {vaultName}
                            </Text>
                            {account && (
                                <AccountLabel
                                    account={account}
                                    intent="neutral"
                                    priority="secondary"
                                    typographyStyle="body-sm"
                                />
                            )}
                        </Column>
                    </Row>
                ) : (
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_EARN" />
                    </Text>
                )}

                <Box margin={{ left: 'auto' }}>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onClick={onHowItWorksClick}
                        isDisabled={!account || !routeParams}
                    >
                        <Translation id="TR_EARN_HOW_IT_WORKS" />
                    </Button>
                </Box>
            </Row>
        </PageHeader>
    );
};
