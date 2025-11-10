import { ReactNode } from 'react';

import { Row, Spinner, SpinnerProps } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface InlineLoaderProps {
    children: ReactNode;
    loading: boolean;
    size?: SpinnerProps['size'];
    testId?: string;
}

export function InlineLoader({ children, loading, size = 20, testId }: InlineLoaderProps) {
    if (!loading) {
        return <>{children}</>;
    }

    return (
        <Row gap={spacings.sm} data-testid={testId}>
            <Spinner size={size} />
            {children}
        </Row>
    );
}
