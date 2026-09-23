import { useEffect, useEffectEvent } from 'react';

import { type NavigationAction, useNavigation } from '@react-navigation/native';

import {
    type NavigationRemoveActionTypes,
    matchesNavigationRemoveAction,
} from '../navigationRemove';

export type UseOnNavigationRemoveParams = {
    /** Defaults to true. Disabling the observer disables its callback. */
    isEnabled?: boolean;
    /** Defaults to all removal actions; an empty list observes none. */
    actionTypes?: NavigationRemoveActionTypes;
    /** Observes an attempt, even if another guard blocks it. Return values are ignored. */
    onRemoveAttempt: (action: NavigationAction) => void;
};

/**
 * Observes screen-removal attempts to trigger side effects (e.g. analytics, state cleanup) without blocking navigation.
 */
export const useOnNavigationRemove = ({
    isEnabled = true,
    actionTypes = 'all',
    onRemoveAttempt,
}: UseOnNavigationRemoveParams) => {
    const navigation = useNavigation();
    const onBeforeRemove = useEffectEvent((action: NavigationAction) => {
        if (isEnabled && matchesNavigationRemoveAction(actionTypes, action)) {
            onRemoveAttempt(action);
        }
    });

    useEffect(
        () => navigation.addListener('beforeRemove', event => onBeforeRemove(event.data.action)),
        [navigation],
    );
};
