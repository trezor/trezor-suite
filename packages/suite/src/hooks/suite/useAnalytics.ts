import { useSelector } from 'react-redux';
import * as analyticsActions from '@suite-actions/analyticsActions';
import { AppState } from '@suite-types';
import { useActions } from '@suite-hooks';

export const useAnalytics = () => {
    const analytics = useSelector<AppState, AppState['analytics']>(state => state.analytics);

    const actions = useActions({
        report: analyticsActions.report,
        init: analyticsActions.init,
        dispose: analyticsActions.dispose,
    });

    return {
        ...analytics,
        ...actions,
    };
};
