import { type StoreEnhancer } from '@reduxjs/toolkit';

const ROZENITE_REDUX_DEVTOOLS_MAX_AGE = 20;

export const getRozeniteDevToolsEnhancers = (): StoreEnhancer[] => {
    if (!__DEV__ || process.env.EXPO_PUBLIC_IS_ROZENITE_REDUX_DEVTOOLS_ENABLED !== 'true') {
        return [];
    }

    // eslint-disable-next-line import/no-extraneous-dependencies
    const { rozeniteDevToolsEnhancer } = require('@rozenite/redux-devtools-plugin');

    return [
        rozeniteDevToolsEnhancer({
            maxAge: ROZENITE_REDUX_DEVTOOLS_MAX_AGE,
        }),
    ];
};
