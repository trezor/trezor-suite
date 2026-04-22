import React, { Suspense, lazy } from 'react';

const AlertRenderer = lazy(() =>
    import('@suite-native/alerts').then(m => ({ default: m.AlertRenderer })),
);

export const alertRendererDecorator = (Story: React.FC) => (
    <>
        <Story />
        <Suspense fallback={null}>
            <AlertRenderer />
        </Suspense>
    </>
);
