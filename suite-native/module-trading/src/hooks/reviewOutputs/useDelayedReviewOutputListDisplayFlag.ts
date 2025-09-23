import { useCallback, useEffect, useState } from 'react';

import { useWaitForButtonRequest } from '@suite-native/transaction-management';

export const useDelayedReviewOutputListDisplayFlag = () => {
    const [shouldDisplayReviewList, setShouldDisplayReviewList] = useState(false);
    const displayReviewList = useCallback(() => setShouldDisplayReviewList(true), []);
    const requestReviewList = useWaitForButtonRequest(displayReviewList);

    useEffect(() => {
        requestReviewList();
    }, [requestReviewList]);

    return shouldDisplayReviewList;
};
