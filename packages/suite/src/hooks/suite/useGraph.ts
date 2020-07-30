import { useSelector, useActions } from '@suite-hooks';
import * as graphActions from '@wallet-actions/graphActions';

export const useGraph = () => {
    const selectedRange = useSelector(state => state.wallet.graph.selectedRange);
    const selectedView = useSelector(state => state.wallet.graph.selectedView);

    const actions = useActions({
        setSelectedRange: graphActions.setSelectedRange,
        setSelectedView: graphActions.setSelectedView,
        updateGraphData: graphActions.updateGraphData,
    });

    return {
        selectedRange,
        selectedView,
        ...actions,
    };
};
