/*
 Static import for polyfills. In createBaseConfig.ts, we use the useBuiltIns: 'entry' Babel setting, which determines
 which polyfills are picked as per the browserslist target.
*/
import 'core-js/actual';

import { Suspense } from 'react';

import { useDebugLanguageShortcut } from '@suite/debug';
import { AppRouter, Main, Preloader } from '@suite-app/app';
import {
    BundleLoader,
    Metadata,
    ToasterProvider,
    useConnectPopupWeb,
    useConnectPopupWebextension,
    useTor,
} from '@trezor/suite';

import { usePlaywright } from './support/usePlaywright';
import { webComponents } from './support/webComponents';

export const MainWeb = () => {
    usePlaywright();
    useTor();
    useDebugLanguageShortcut();
    useConnectPopupWeb();
    useConnectPopupWebextension();

    return (
        <Main>
            <Metadata />
            <ToasterProvider />
            <Preloader>
                <Suspense fallback={<BundleLoader />}>
                    <AppRouter components={webComponents} />
                </Suspense>
            </Preloader>
        </Main>
    );
};
