import { type ReactNode } from 'react';

import { TxSimulationBanner } from './TxSimulationBanner';

interface TxSimulationErrorProps {
    children: ReactNode;
    error?: ReactNode | null;
}

export function TxSimulationError({ children, error }: TxSimulationErrorProps) {
    if (!error) {
        return children;
    }

    return (
        <TxSimulationBanner
            type="error"
            title="TR_SIMULATION_ERROR"
            description={error}
            isAccepted={false}
        />
    );
}
