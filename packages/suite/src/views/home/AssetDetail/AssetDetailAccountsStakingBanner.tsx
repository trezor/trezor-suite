import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import { events as sharedEvents } from '@suite-common/analytics';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { EarnEthBannerView } from '#src/components/wallet/StakingBanner/EarnEthBannerView';
import { StakingBannerView } from '#src/components/wallet/StakingBanner/StakingBannerView';
import {
    type StakingBannerAccounts,
    useStakingBanner,
} from '#src/components/wallet/StakingBanner/useStakingBanner';

type AssetDetailAccountsStakingBannerProps = {
    accounts: StakingBannerAccounts;
};

export const AssetDetailAccountsStakingBanner = ({
    accounts,
}: AssetDetailAccountsStakingBannerProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { kind, earnEthApy, close } = useStakingBanner(accounts);
    const networkSymbol = accounts[0].symbol;

    const goToEarn = () => dispatch(gotoThunk({ routeName: 'suite-earn' }));

    if (kind === undefined) {
        return null;
    }

    if (kind === 'earnEth') {
        const reportYieldNavigate = (action: 'continue' | 'cancel') =>
            analytics.report({
                type: sharedEvents.yieldNavigateEvent.name,
                payload: {
                    action,
                    from: 'asset-detail-banner',
                    to: 'earn-dashboard',
                    networkSymbol,
                },
            });

        return (
            <EarnEthBannerView
                networkSymbol={networkSymbol}
                apy={earnEthApy}
                onExplore={() => {
                    goToEarn();
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
            payload: { action, from: 'asset-detail/banner', networkSymbol },
        });

    return (
        <StakingBannerView
            accounts={accounts}
            onExplore={() => {
                goToEarn();
                reportStakingNavigate('navigate');
            }}
            onClose={() => {
                close();
                reportStakingNavigate('cancel');
            }}
        />
    );
};
