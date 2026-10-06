import { useSelector as useReduxSelector } from 'react-redux';

import isEqualWith from 'lodash/isEqualWith';

export const useSelectorDeepComparison: typeof useReduxSelector = selector =>
    useReduxSelector(selector, isEqualWith);

useSelectorDeepComparison.withTypes = useReduxSelector.withTypes;
