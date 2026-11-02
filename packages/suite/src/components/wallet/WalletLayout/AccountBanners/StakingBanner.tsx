import { useMemo } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk, selectRouter } from '@suite/router';
import { events as sharedEvents } from '@suite-common/analytics';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnEthBannerView } from 'src/components/wallet/StakingBanner/EarnEthBannerView';
import { StakingBannerView } from 'src/components/wallet/StakingBanner/StakingBannerView';
import { useStakingBanner } from 'src/components/wallet/StakingBanner/useStakingBanner';
import { useSelector } from 'src/hooks/suite';

type StakingBannerProps = {
    account: Account;
};

export const StakingBanner = ({ account }: StakingBannerProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { route } = useSelector(selectRouter);
    const accounts = useMemo(() => [account] as const, [account]);
    const { kind, earnEthApy, close } = useStakingBanner(accounts);

    if (route?.name !== 'wallet-index' || kind === undefined) {
        return null;
    }

    if (kind === 'earnEth') {
        const reportYieldNavigate = (action: 'continue' | 'cancel') =>
            analytics.report({
                type: sharedEvents.yieldNavigateEvent.name,
                payload: {
                    action,
                    from: 'account-banner',
                    to: 'earn-dashboard',
                    networkSymbol: account.symbol,
                },
            });

        return (
            <EarnEthBannerView
                networkSymbol={account.symbol}
                apy={earnEthApy}
                onExplore={() => {
                    dispatch(gotoThunk({ routeName: 'suite-earn' }));
                    reportYieldNavigate('continue');
                }}
                onClose={() => {
                    close();
                    reportYieldNavigate('cancel');
                }}
            />
        );
    }

    const reportStakingNavigate = (action: 'navigate' | 'cancel') =>
        analytics.report({
            type: events.stakingNavigateEvent.name,
            payload: {
                action,
                from: 'account/banner',
                networkSymbol: account.symbol,
            },
        });

    return (
        <StakingBannerView
            accounts={accounts}
            onExplore={() => {
                dispatch(gotoThunk({ routeName: 'wallet-staking', preserveParams: true }));
                reportStakingNavigate('navigate');
            }}
            onClose={() => {
                close();
                reportStakingNavigate('cancel');
            }}
        />
    );
};
