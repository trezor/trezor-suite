import { AppState } from '@suite-types';
import { useSelector as useReduxSelector, TypedUseSelectorHook } from 'react-redux';

export { useDevice } from './useDevice';
export { useDiscovery } from './useDiscovery';
export { useScrollRef } from './useScrollRef';
export { useAnalytics } from './useAnalytics';
export { useActions } from './useActions';

/**
 * Properly typed useSelector hook, use this one instead of directly importing it from react-redux.
 * https://react-redux.js.org/using-react-redux/static-typing#typing-the-useselector-hook
 */
export const useSelector: TypedUseSelectorHook<AppState> = useReduxSelector;
