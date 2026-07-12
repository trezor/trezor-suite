import { AccountLabel } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goto, selectRouteName, selectSettingsBackRoute } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectTronStakeSession } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Box, Button, Column, IconButton, Row, Text } from '@trezor/components';
import { CaretLeftIcon, InfoIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { TRON_FLOW_BY_ROUTE } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

type TronStakePageHeaderProps = {
    account?: Account;
};

export const TronStakePageHeader = ({ account }: TronStakePageHeaderProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { translationString } = useTranslation();
    const { isBelowMobile } = useLayoutSize();
    const previousRoute = useSelector(selectSettingsBackRoute);
    const routeName = useSelector(selectRouteName);

    const flow = routeName ? TRON_FLOW_BY_ROUTE[routeName] : undefined;
    const flowStep = useSelector(state =>
        account && flow ? selectTronStakeSession(state, account.key, flow).step : undefined,
    );

    const reportFlowClose = () => {
        if (!account || !flow || flowStep === 'complete') {
            return;
        }

        const payload = { action: 'close', networkSymbol: account.symbol } as const;

        switch (flow) {
            case 'stake':
                analytics.report({
                    type: events.stakingStakeEvent.name,
                    payload: { ...payload, step: 'stake-form-modal' },
                });
                break;
            case 'vote':
                analytics.report({
                    type: events.stakingUpdateProviderEvent.name,
                    payload: { ...payload, step: 'stake-form-modal' },
                });
                break;
            case 'unstake':
                analytics.report({
                    type: events.stakingUnstakeEvent.name,
                    payload: { ...payload, step: 'unstake-form-modal' },
                });
                break;
            case 'withdraw':
                analytics.report({
                    type: events.stakingUnstakeEvent.name,
                    payload: { ...payload, step: 'withdraw-form-modal' },
                });
                break;
            case 'claim':
                analytics.report({
                    type: events.stakingClaimEvent.name,
                    payload: { ...payload, step: 'claim-form-modal' },
                });
                break;
            default:
                exhaustive(flow);
        }
    };

    const onBackClick = () => {
        reportFlowClose();
        dispatch(goto({ routeName: previousRoute.name, params: previousRoute.params }));
    };

    const onHowItWorksClick = () => {
        dispatch(openModal({ type: 'tron-stake-in-a-nutshell', actionType: 'close' }));
    };

    return (
        <PageHeader>
            <Row width="100%" gap={16} alignItems="center">
                <IconButton
                    icon={CaretLeftIcon}
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    onClick={onBackClick}
                    data-testid="@account-subpage/back"
                    tooltip={{ content: <Translation id="TR_BACK" /> }}
                />
                {account ? (
                    <Row alignItems="center" gap={12} overflow="hidden">
                        <TokenIcon symbol={account.symbol} size={32} />
                        <Column gap={2} overflow="hidden">
                            <Text
                                typographyStyle="body-md-strong"
                                ellipsisLineCount={isBelowMobile ? 0 : 1}
                            >
                                <Translation id="TR_EARN_STAKING_DASHBOARD_TITLE" />
                            </Text>
                            <AccountLabel
                                account={account}
                                showAccountTypeBadge
                                accountTypeBadgeSize="small"
                                intent="neutral"
                                priority="secondary"
                                typographyStyle="body-sm"
                            />
                        </Column>
                    </Row>
                ) : (
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_EARN_STAKING_DASHBOARD_TITLE" />
                    </Text>
                )}

                <Box margin={{ left: 'auto' }}>
                    {isBelowMobile ? (
                        <IconButton
                            icon={InfoIcon}
                            intent="neutral"
                            priority="secondary"
                            size="large"
                            aria-label={translationString('TR_EARN_HOW_IT_WORKS')}
                            onClick={onHowItWorksClick}
                            tooltip={{ content: <Translation id="TR_EARN_HOW_IT_WORKS" /> }}
                        />
                    ) : (
                        <Button intent="neutral" priority="secondary" onClick={onHowItWorksClick}>
                            <Translation id="TR_EARN_HOW_IT_WORKS" />
                        </Button>
                    )}
                </Box>
            </Row>
        </PageHeader>
    );
};
