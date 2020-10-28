import * as analyticsActions from '@suite-actions/analyticsActions';
import { useActions, useSelector } from '@suite-hooks';

export const useAnalytics = () => {
    const analytics = useSelector(state => state.analytics);

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
