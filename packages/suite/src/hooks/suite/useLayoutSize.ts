import { useSelector } from 'src/hooks/suite';
import { selectBreakpointFlags } from 'src/reducers/suite/windowReducer';

// This hook provides information about breakpoints using media queries
export const useLayoutSize = () => useSelector(selectBreakpointFlags);
