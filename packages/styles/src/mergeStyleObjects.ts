import { assignStyle as untypedAssignStyle } from 'css-in-js-utils';
import { A } from '@mobily/ts-belt';
import felaPluginExtend from 'fela-plugin-extend';

import { NativeStyleObject, StyleObject } from './types';

const applyExtendPlugin = felaPluginExtend() as <T>(styleObject: T) => T;
const assignStyle = untypedAssignStyle as any as (...styleObjects: StyleObject[]) => StyleObject;

export const mergeStyleObjects = (styleObjects: StyleObject[]): StyleObject =>
    styleObjects.length === 1
        ? applyExtendPlugin(styleObjects[0])
        : assignStyle({}, ...styleObjects.map(applyExtendPlugin));

export const mergeNativeStyleObjects = (styleObjects: NativeStyleObject[]): NativeStyleObject =>
    styleObjects.length === 1
        ? applyExtendPlugin(styleObjects[0])
        : A.reduce(styleObjects.map(applyExtendPlugin), {}, Object.assign);
