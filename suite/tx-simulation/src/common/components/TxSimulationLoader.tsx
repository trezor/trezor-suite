import { type ReactNode } from 'react';

import { Spinner } from '@trezor/components';

interface TxSimulationLoaderProps {
    children: ReactNode;
    isLoading: boolean;
}

export function TxSimulationLoader({ children, isLoading }: TxSimulationLoaderProps) {
    if (isLoading) {
        return <Spinner size={48} isDisabled={true} />;
    }

    return children;
}
