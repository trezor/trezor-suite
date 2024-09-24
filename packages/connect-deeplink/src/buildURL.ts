import { schema, version } from './config';

export const buildURL = (method: string, params: any, callback: string) => {
    return `${schema}://connect/${version}?method=${method}&params=${encodeURIComponent(
        JSON.stringify(params),
    )}&callback=${encodeURIComponent(callback)}`;
};
