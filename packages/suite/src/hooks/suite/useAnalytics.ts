import * as analyticsActions from '@suite-actions/analyticsActions';
import { useActions } from '@suite-hooks/useActions';
import { useSelector } from '@suite-hooks/useSelector';

export const useAnalytics = () => {
    const analytics = useSelector(state => state.analytics);

    const actions = useActions({
        report: analyticsActions.report,
        init: analyticsActions.init,
        enable: analyticsActions.enable,
        dispose: analyticsActions.dispose,
    });

    return {
        ...analytics,
        ...actions,
    };
};
