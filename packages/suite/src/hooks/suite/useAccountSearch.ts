import * as accountSearchActions from '@wallet-actions/accountSearchActions';
import { useSelector, useActions } from '@suite-hooks';

export const useAccountSearch = () => {
    const { coinFilter, searchString } = useSelector(state => state.wallet.accountSearch);
    const { setCoinFilter, setSearchString } = useActions({
        setCoinFilter: accountSearchActions.setCoinFilter,
        setSearchString: accountSearchActions.setSearchString,
    });

    return {
        coinFilter,
        setCoinFilter,
        searchString,
        setSearchString,
    };
};
