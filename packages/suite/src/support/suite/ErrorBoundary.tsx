import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useDispatch } from 'react-redux';

import { Error } from 'src/components/suite/Error';
import { reportToSentry } from 'src/utils/suite/sentry';

const Fallback = ({ error }: { error: Error }) => <Error error={error.message} />;

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useDispatch();

    return (
        <ReactErrorBoundary
            FallbackComponent={Fallback}
            onError={error => {
                dispatch(reportToSentry(error));
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
};
