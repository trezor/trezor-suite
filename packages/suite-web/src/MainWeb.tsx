import 'core-js/actual';

import { Suspense } from 'react';

import { useDebugLanguageShortcut } from '@suite/debug';

import {
    AppRouter,
    BundleLoader,
    Metadata,
    Preloader,
    ToasterProvider,
} from 'src/components/suite';
import { Main } from 'src/support/suite/Main';
import { useConnectPopupWeb } from 'src/support/suite/useConnectPopupWeb';
import { useConnectPopupWebextension } from 'src/support/suite/useConnectPopupWebextension';
import { useTor } from 'src/support/suite/useTor';

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
