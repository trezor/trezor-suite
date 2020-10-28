import { useSelector, useActions } from '@suite-hooks';
import * as graphActions from '@wallet-actions/graphActions';

export const useGraph = () => {
    const { selectedRange, selectedView } = useSelector(state => ({
        selectedRange: state.wallet.graph.selectedRange,
        selectedView: state.wallet.graph.selectedView,
    }));

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
