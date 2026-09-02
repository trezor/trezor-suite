import { type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { TxSimulationBanner } from '@suite/tx-simulation/src/common';
import { useDispatch } from '@suite-common/redux-utils';

import { reportToSentryThunk } from 'src/utils/suite/sentry';

export interface TxSimulationErrorBoundaryProps {
    children: ReactNode;
    isAccepted: boolean;
    onChange: (isAccepted: boolean) => void;
    onError: (hasFailed: boolean) => void;
    resetKey: unknown;
}

/**
 * Contains a failure to render a scan result, so an unexpected response shape cannot take the whole
 * app down from a signing screen. `onError` lets the modal keep its confirm button disabled — the
 * user must not sign a transaction whose simulation never rendered.
 */
export function TxSimulationErrorBoundary({
    children,
    isAccepted,
    onChange,
    onError,
    resetKey,
}: TxSimulationErrorBoundaryProps) {
    const dispatch = useDispatch();

    return (
        <ErrorBoundary
            fallback={
                <TxSimulationBanner
                    type="error"
                    title="TR_SIMULATION_ERROR"
                    isAccepted={isAccepted}
                    onChange={onChange}
                />
            }
            onError={error => {
                onError(true);
                // The error itself only ever carries a React message; the scan payload behind it
                // holds addresses and balances and must never be reported.
                dispatch(reportToSentryThunk(error));
            }}
            // A later refetch can still deliver a renderable result.
            resetKeys={[resetKey]}
            onReset={() => onError(false)}
        >
            {children}
        </ErrorBoundary>
    );
}
