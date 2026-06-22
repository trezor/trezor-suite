import { getHDPath } from './getHDPath';
import { fromHardenedPathPart } from './hardened';

export const getAddressPathIndex = (path: string) => {
    const result = getHDPath(path);

    if (!result.success) {
        return undefined;
    }

    const pathIndex = result.payload[result.payload.length - 1];

    return pathIndex === undefined ? undefined : fromHardenedPathPart(pathIndex);
};
