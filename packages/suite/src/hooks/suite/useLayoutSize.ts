import { useSelector } from './useSelector';
import { selectBreakpointFlags } from '../../reducers/suite/windowReducer';

// This hook provides information about breakpoints using media queries
export const useLayoutSize = () => useSelector(selectBreakpointFlags);
