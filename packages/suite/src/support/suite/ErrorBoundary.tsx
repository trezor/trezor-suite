import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';

import { Error } from 'src/components/suite/Error';
import { reportToSentryThunk } from 'src/utils/suite/sentry';

const Fallback = ({ error }: { error: Error }) => <Error error={error.message} />;

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    const { dispatch } = useServices(selectDispatch);

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
