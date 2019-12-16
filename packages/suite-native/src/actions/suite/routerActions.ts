import { Linking } from 'react-native';
import { Actions } from 'react-native-router-flux';
import { ROUTER } from '@suite-actions/constants';

// export const LOCATION_CHANGE = '@router/location-change';
export const UPDATE = 'goto';

interface LocationChange {
    type: typeof ROUTER.LOCATION_CHANGE;
    url: string;
}

export type RouterActions = LocationChange;

export const onLocationChange = (url: string) => {
    return {
        type: ROUTER.LOCATION_CHANGE,
        url,
    };
};

// links inside of application
export const goto = (url: string, _options?: any) => () => {
    console.log(url);
    // TODO: check if requested url != current url
    const [pathname, hash] = url.split('#');
    console.log(pathname, hash);
    try {
        Actions[pathname].call(undefined, hash ? { hash } : undefined);
    } catch (error) {
        console.error(error);
        // TODO: catch error
    }

    // TODO: check requested scene depth and perform push replace or reset
    // Actions.push(scene, { hash: hash });
    // Actions.replace(pathname, { hash: hash });
};

// external links
export const gotoUrl = (url: string) => {
    Linking.openURL(url);
};

export const init = () => () => {};
export const initialRedirection = () => () => {};
