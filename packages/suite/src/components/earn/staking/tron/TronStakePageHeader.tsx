import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { goBackThunk, gotoThunk, selectRouteName } from '@suite/router';
import { selectTronStakeSession } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Box, Button, IconButton } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { InfoIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { EarnAccountPageHeader } from '#src/components/earn/common/EarnAccountPageHeader';
import { TRON_FLOW_BY_ROUTE, getStakingAccountRouteParams } from '#src/constants/suite/staking';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';
import { useSelector } from '#src/hooks/suite/useSelector';

type TronStakePageHeaderProps = {
    account?: Account;
};

export const TronStakePageHeader = ({ account }: TronStakePageHeaderProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { translationString } = useTranslation();
    const { isBelowMobile } = useLayoutSize();
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

        if (routeName === 'earn-staking-tron') {
            dispatch(gotoThunk({ routeName: 'suite-earn' }));

            return;
        }

        dispatch(
            goBackThunk({
                fallback: account
                    ? {
                          routeName: 'earn-staking-tron',
                          params: getStakingAccountRouteParams(account),
                      }
                    : { routeName: 'suite-earn' },
            }),
        );
    };

    const onHowItWorksClick = () => {
        dispatch(openModal({ type: 'tron-stake-in-a-nutshell', actionType: 'close' }));
    };

    return (
        <EarnAccountPageHeader
            title={<Translation id="TR_EARN_STAKING" />}
            account={account}
            onBack={onBackClick}
            actions={
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
                        <Button
                            intent="neutral"
                            priority="secondary"
                            onClick={onHowItWorksClick}
                            data-testid="@staking/tron-header/how-it-works-button"
                        >
                            <Translation id="TR_EARN_HOW_IT_WORKS" />
                        </Button>
                    )}
                </Box>
            }
        />
    );
};
