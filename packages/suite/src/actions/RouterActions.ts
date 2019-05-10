import Router from 'next/router';

export const LOCATION_CHANGE = '@router/location-change';
export const UPDATE = '@router/update';

export interface RouterActions {
    type: typeof LOCATION_CHANGE;
    pathname: string;
}

export const onLocationChange = (pathname: string): RouterActions => {
    return {
        type: LOCATION_CHANGE,
        pathname,
    };
};

// links inside of application
export const goto = (url: string) => {
    Router.push(url);
    return {
        type: UPDATE,
        message: url,
    };
};
