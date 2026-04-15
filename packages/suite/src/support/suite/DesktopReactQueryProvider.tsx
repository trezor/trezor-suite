import { type PropsWithChildren, Suspense, lazy } from 'react';

import { ReactQueryProvider } from '@suite-common/react-query';
import { isDevEnv } from '@suite-common/suite-utils';

const Devtools = lazy(async () => {
    const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools');

    return { default: ReactQueryDevtools };
});

const SHOW_DEV_TOOLS = isDevEnv && process.env.TANSTACK_REACT_QUERY_DEV_TOOLS === 'true';

export const DesktopReactQueryProvider = ({ children }: PropsWithChildren) => (
    <ReactQueryProvider
        refetchOnWindowFocus
        refetchOnMount
        refetchOnReconnect
        devtools={
            SHOW_DEV_TOOLS ? (
                <Suspense fallback={null}>
                    <Devtools />
                </Suspense>
            ) : undefined
        }
    >
        {children}
    </ReactQueryProvider>
);
