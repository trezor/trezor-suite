import { createRenderer as createFelaRenderer, TPlugin } from 'fela';
import felaEnforceLonghands from 'fela-enforce-longhands';
import felaPluginEmbedded from 'fela-plugin-embedded';
import felaPluginMultipleSelectors from 'fela-plugin-multiple-selectors';
import felaPluginPlaceholderPrefixer from 'fela-plugin-placeholder-prefixer';
import felaPluginUnit from 'fela-plugin-unit';
import felaSortMediaQueryMobileFirst from 'fela-sort-media-query-mobile-first';

import { makeResponsiveValuePlugin } from './plugins/responsiveValues';
import { makeTypedSelectorsPlugin } from './plugins/typedSelectors';

const isDevEnv = process.env.NODE_ENV === 'development';

export const createRenderer = () =>
    createFelaRenderer({
        devMode: isDevEnv,
        enhancers: [
            felaEnforceLonghands(),
            // TODO: if this will be used add fela-monolithic for better debugging in dev
            felaSortMediaQueryMobileFirst(),
        ],
        plugins: [
            makeTypedSelectorsPlugin() as TPlugin,
            felaPluginUnit(),
            felaPluginEmbedded(),
            felaPluginMultipleSelectors(),
            felaPluginPlaceholderPrefixer(),
            makeResponsiveValuePlugin() as TPlugin,
        ],
        // NOTE: Using a selector prefix is necessary because Fela generates class names like
        // `x y z aa ab ac`, meaning possible conflicts with classes such as `btn`.
        selectorPrefix: '_',
    });
