import { selectBreakpointFlags } from 'src/reducers/suite/windowReducer';

import { useSelector } from './useSelector';

// This hook provides information about breakpoints using media queries
export const useLayoutSize = () => useSelector(selectBreakpointFlags);
