import * as accountSearchActions from 'src/actions/wallet/accountSearchActions';
import { useActions, useSelector } from 'src/hooks/suite';

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
