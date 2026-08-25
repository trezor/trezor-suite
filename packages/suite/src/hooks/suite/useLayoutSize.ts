import { useSelectorDeepComparison } from '@suite-common/redux-utils';

import { selectBreakpointFlags } from 'src/reducers/suite/windowReducer';

// This hook provides information about breakpoints using media queries
export const useLayoutSize = () => useSelectorDeepComparison(selectBreakpointFlags);
