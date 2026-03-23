import felaPluginExtend from 'fela-plugin-extend';

import { type NativeStyleObject } from './types';

const applyExtendPlugin = felaPluginExtend() as <T>(styleObject: T) => T;

export const mergeNativeStyleObjects = (styleObjects: NativeStyleObject[]): NativeStyleObject =>
    styleObjects.length === 1
        ? applyExtendPlugin(styleObjects[0])
        : (Object.assign({}, ...styleObjects.map(applyExtendPlugin)) as NativeStyleObject);
