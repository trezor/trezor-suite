import { Suspense, lazy, memo } from 'react';

const WordInputInner = lazy(() =>
    import('./WordInputInner').then(module => ({ default: module.WordInputInner })),
);

export const WordInput = memo(() => (
    <Suspense fallback={null}>
        <WordInputInner />
    </Suspense>
));

WordInput.displayName = 'WordInput';
