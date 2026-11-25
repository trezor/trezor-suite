import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import { type NavigateFlowFrom } from '@suite-common/analytics';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type OpenAssetParams = {
    networkSymbol: NetworkSymbol;
    /** Left out for a network's coin. */
    contractAddress?: TokenAddress;
};

type UseOpenAssetParams = {
    /** Where the navigation starts, as analytics names it. */
    from: NavigateFlowFrom;
};

/** Opens an asset's detail and reports where the user went there from. */
export const useOpenAsset = ({ from }: UseOpenAssetParams) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    return ({ networkSymbol, contractAddress }: OpenAssetParams) => {
        analytics.report({
            type: events.navigateFlowEvent.name,
            payload: { action: 'navigate', type: 'asset', from, networkSymbol },
        });
        dispatch(
            gotoThunk({
                routeName: 'suite-asset',
                params: { symbol: networkSymbol, contractAddress },
            }),
        );
    };
};
