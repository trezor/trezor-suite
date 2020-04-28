import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as analyticsActions from '@suite-actions/analyticsActions';
import { AppState } from '@suite-types';

export const useAnalytics = () => {
    const dispatch = useDispatch();

    const analytics = useSelector<AppState, AppState['analytics']>(state => state.analytics);

    const actions = useMemo(
        () => ({
            report: bindActionCreators(analyticsActions.report, dispatch),
            init: bindActionCreators(analyticsActions.init, dispatch),
            dispose: bindActionCreators(analyticsActions.dispose, dispatch),
        }),
        [dispatch],
    );

    return {
        ...analytics,
        ...actions,
    };
};
