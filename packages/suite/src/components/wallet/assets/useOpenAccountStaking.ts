import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import { type NavigateFlowFrom } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type UseOpenAccountStakingParams = {
    /** Where the navigation starts, as analytics names it. */
    from: NavigateFlowFrom;
};

/** Opens the selected account's Staking and reports where the user went there from. */
export const useOpenAccountStaking = ({ from }: UseOpenAccountStakingParams) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    return (networkSymbol: NetworkSymbol) => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', type: 'earn', from, networkSymbol },
        });
        dispatch(gotoThunk({ routeName: 'wallet-staking', preserveParams: true }));
    };
};
