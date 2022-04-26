import { assignStyle } from 'css-in-js-utils';
import { A, G, D } from '@mobily/ts-belt';
import { StyleObject } from '../types';
import { breakpointMediaQueries, breakpoints } from '../breakpoints';

const intersection = (list1: readonly any[], list2: readonly any[]) => {
    const toKeep = new Set();

    for (let i = 0; i < list1.length; i += 1) {
        toKeep.add(list1[i]);
    }

    return A.uniq(A.filter(list2, toKeep.has.bind(toKeep)));
};

// NOTE: Mutations for maximum performance. Yuck.
const resolveResponsiveValues = (styleObject: StyleObject) => {
    Object.entries(styleObject).forEach(([propertyName, propertyValue]) => {
        if (G.isObject(propertyValue)) {
            const isResponsiveValue = A.isNotEmpty(
                intersection(breakpoints, D.keys(propertyValue)),
            );

            if (isResponsiveValue) {
                Object.entries(propertyValue).forEach(
                    ([breakpointName, breakpointPropertyValue]: [string, any]) => {
                        if (breakpointName === 'xs') {
                            return assignStyle(styleObject as any, {
                                [propertyName]: breakpointPropertyValue,
                            });
                        }

                        const mediaQuery = breakpointMediaQueries[breakpointName];

                        if (!mediaQuery) {
                            return;
                        }

                        assignStyle(styleObject as any, {
                            [mediaQuery]: {
                                [propertyName]: breakpointPropertyValue,
                            },
                        });
                    },
                );

                // NOTE: If `propertyValue` contains an `xs` property, it will get overwritten by the value.
                // If it doesn't contain this property, the `{ sm, md, lg, xl }` object will stay, so we need
                // to remove it. See the tests to understand the desired behaviour.
                if (G.isObject(styleObject[propertyName])) {
                    delete styleObject[propertyName];
                }
            } else {
                resolveResponsiveValues(propertyValue as StyleObject);
            }
        }
    });

    return styleObject;
};

export const makeResponsiveValuePlugin = () => resolveResponsiveValues;
