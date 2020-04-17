import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import * as analyticsActions from '@suite-actions/analyticsActions';

export const useAnalytics = () => {
    const dispatch = useDispatch();

    const report = useCallback(
        (analyticsPayload: analyticsActions.Payload) => {
            dispatch(analyticsActions.report(analyticsPayload));
        },
        [dispatch],
    );

    return {
        report,
    };
};
