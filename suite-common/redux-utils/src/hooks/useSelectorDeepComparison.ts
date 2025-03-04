import { useSelector } from 'react-redux';

import isEqualWith from 'lodash/isEqualWith';

export const useSelectorDeepComparison: typeof useSelector = selector =>
    useSelector(selector, (a, b) => {
        const result = isEqualWith(a, b);

        return result;
    });

useSelectorDeepComparison.withTypes = useSelector.withTypes;
