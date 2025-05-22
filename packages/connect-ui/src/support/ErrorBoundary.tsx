import type { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

export const ErrorBoundary = ({ children }: { children: ReactNode }) => (
    <ReactErrorBoundary fallback="Something went wrong">{children}</ReactErrorBoundary>
);
