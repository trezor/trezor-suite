import { AppState } from '@suite-types';
import { useSelector as useReduxSelector, shallowEqual, TypedUseSelectorHook } from 'react-redux';

/**
 * Properly typed useSelector hook, use this one instead of directly importing it from react-redux.
 * https://react-redux.js.org/using-react-redux/static-typing#typing-the-useselector-hook
 * Memoized using shallowEqual equality comparison
 * https://react-redux.js.org/api/hooks#equality-comparisons-and-updates
 */
export const useSelector: TypedUseSelectorHook<AppState> = (selector, equalityFn = shallowEqual) =>
    useReduxSelector(selector, equalityFn);
