import { useSelector } from 'react-redux';

import { selectStakingListItems, selectStakingListSymbols } from '../../earnListSelectors';

export const useStakingPositions = () => {
    const positions = useSelector(selectStakingListItems);
    const symbols = useSelector(selectStakingListSymbols);

    return { positions, symbols };
};
