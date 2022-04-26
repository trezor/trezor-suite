import { G, D } from '@mobily/ts-belt';
import { StyleObject } from '../types';

// NOTE: Mutations for maximum performance. Yuck.
const applyNestedSelectors = (styleObject: StyleObject): StyleObject => {
    if (G.isObject(styleObject.selectors)) {
        Object.assign(styleObject, D.map(styleObject.selectors, applyNestedSelectors));

        delete styleObject.selectors;
    }

    if (G.isArray(styleObject.extend)) {
        styleObject.extend.forEach(({ style }) => applyNestedSelectors(style));
    } else if (G.isObject(styleObject.extend)) {
        applyNestedSelectors(styleObject.extend.style);
    }

    return styleObject;
};

export const makeTypedSelectorsPlugin = () => applyNestedSelectors;
