import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { Error } from 'src/components/suite/Error';
import { reportToSentryThunk } from 'src/utils/suite/sentry';

type FallbackProps = { error: Error };

const Fallback = ({ error }: FallbackProps) => <Error error={error.message} />;

type ErrorBoundaryProps = { children: React.ReactNode };

export const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
    const { dispatch } = useServices(injectDispatch);

    return (
        <ReactErrorBoundary
            FallbackComponent={Fallback}
            onError={error => {
                dispatch(reportToSentryThunk(error));
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
};
