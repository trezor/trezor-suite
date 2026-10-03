import { type NavigationAction } from '@react-navigation/native';

export type NavigationRemoveActionTypes = readonly NavigationAction['type'][] | 'all';

/** Standard back navigation and native-stack back gestures. */
export const BACK_NAVIGATION_ACTIONS: readonly NavigationAction['type'][] = ['GO_BACK', 'POP'];

export const matchesNavigationRemoveAction = (
    actionTypes: NavigationRemoveActionTypes,
    action: NavigationAction,
): boolean => actionTypes === 'all' || actionTypes.includes(action.type);
