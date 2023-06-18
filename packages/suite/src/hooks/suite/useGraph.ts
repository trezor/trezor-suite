import { useSelector, useActions } from 'src/hooks/suite';
import * as graphActions from 'src/actions/wallet/graphActions';

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
