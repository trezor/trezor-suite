import { ON_LOCATION_CHANGE } from './index';

interface OnLocationChangePayload {
    pathname: string;
    search?: string;
}
export type RouterAction = { type: typeof ON_LOCATION_CHANGE; payload: OnLocationChangePayload };

export function onLocationChange(payload: OnLocationChangePayload) {
    return {
        type: ON_LOCATION_CHANGE,
        payload,
    };
}
