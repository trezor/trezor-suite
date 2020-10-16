import * as accountSearchActions from '@wallet-actions/accountSearchActions';
import { useSelector, useActions } from '@suite-hooks';

export const useAccountSearch = () => {
    const { coinFilter } = useSelector(state => state.wallet.accountSearch);
    const { setCoinFilter } = useActions({
        setCoinFilter: accountSearchActions.setCoinFilter,
    });

    return {
        coinFilter,
        setCoinFilter,
    };
};
