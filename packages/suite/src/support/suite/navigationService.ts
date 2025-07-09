// React Router offers access to navigate and location via hooks, which means it is tricky to use them in Redux actions.
// Historically, this functionality was accessed via the history dependency, which is no longer available in React Router 6 or higher.
// Refactoring the whole thing would be too big, that is why this unorthodox approach is used.

import { Location, NavigateFunction, NavigateOptions, To } from 'react-router';

let navigateFn: NavigateFunction | null = null;
let locationRef: Location | null = null;

export const setNavigate = (navigate: NavigateFunction) => {
    navigateFn = navigate;
};

export const setLocation = (location: Location) => {
    locationRef = location;
};

export const navigate = (...args: [To, NavigateOptions?] | [number]) => {
    if (navigateFn) {
        navigateFn(...(args as Parameters<NavigateFunction>));
    } else {
        console.warn('navigate called before initialized');
    }
};

export const getLocation = () => locationRef as Location<any>;
