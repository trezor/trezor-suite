import { Suspense, lazy } from 'react';

import type { TransactionsGraphProps } from 'src/components/suite/graph/types';

type TransactionsGraphLoaderProps = TransactionsGraphProps;

const TransactionsGraph = lazy(() =>
    import('./TransactionsGraph').then(module => ({ default: module.TransactionsGraph })),
);

/**
 * Lazy load transactions graph because it uses heavy dependencies (`recharts`).
 */
export function TransactionsGraphLoader(props: TransactionsGraphLoaderProps) {
    return (
        <Suspense fallback={null}>
            <TransactionsGraph {...props} />
        </Suspense>
    );
}
