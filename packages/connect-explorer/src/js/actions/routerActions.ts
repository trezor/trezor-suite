import { ON_LOCATION_CHANGE } from './index';

export type RouterAction = { type: typeof ON_LOCATION_CHANGE; path: string };

export function onLocationChange(path: string) {
    return {
        type: ON_LOCATION_CHANGE,
        path,
    };
}
