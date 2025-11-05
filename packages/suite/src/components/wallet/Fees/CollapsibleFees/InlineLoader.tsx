import { ReactNode } from 'react';

import { Row, Spinner, SpinnerProps } from '@trezor/components';
import { spacings } from '@trezor/theme';

interface InlineLoaderProps {
    children: ReactNode;
    loading: boolean;
    size?: SpinnerProps['size'];
}

export function InlineLoader({ children, loading, size = 20 }: InlineLoaderProps) {
    if (!loading) {
        return <>{children}</>;
    }

    return (
        <Row gap={spacings.sm}>
            <Spinner size={size} />
            {children}
        </Row>
    );
}
