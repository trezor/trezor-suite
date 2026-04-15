import felaPluginExtend from 'fela-plugin-extend';

import { type NativeStyleObject } from './types';

const applyExtendPlugin = felaPluginExtend() as <T>(styleObject: T) => T;

export const mergeNativeStyleObjects = (styleObjects: NativeStyleObject[]): NativeStyleObject => {
    const first = styleObjects[0];
    if (styleObjects.length === 1 && first) {
        return applyExtendPlugin(first);
    }

    return Object.assign({}, ...styleObjects.map(applyExtendPlugin)) as NativeStyleObject;
};
