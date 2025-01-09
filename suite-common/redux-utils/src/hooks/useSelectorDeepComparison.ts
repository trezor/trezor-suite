import { useSelector } from 'react-redux';

import isEqualWith from 'lodash/isEqualWith';

export const useSelectorDeepComparison: typeof useSelector = (selector, equalityFn) =>
    useSelector(selector, (a, b) => {
        const result = isEqualWith(a, b, equalityFn);

        return result;
    });
