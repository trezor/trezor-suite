import { useSelectorDeepComparison } from '@suite-common/redux-utils';

import { selectBreakpointFlags } from 'src/reducers/suite/windowReducer';

// This hook provides information about breakpoints using media queries.
// The flags are compared by value because the selector builds a new object: comparing by identity
// would re-render every consumer on every action, and on every window blur.
export const useLayoutSize = () => useSelectorDeepComparison(selectBreakpointFlags);
