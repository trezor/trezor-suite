import { gotoThunk } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export type LidoRoute = 'earn-lido' | 'earn-lido-stake' | 'earn-lido-unstake' | 'earn-lido-claim';

export const useNavigateToLidoRoute = (account: Account) => {
    const { dispatch } = useServices(injectDispatch);

    return (routeName: LidoRoute) => {
        dispatch(
            gotoThunk({
                routeName,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };
};
