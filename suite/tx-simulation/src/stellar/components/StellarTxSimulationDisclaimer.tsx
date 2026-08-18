import { type TxSimulationStellarResult } from '@suite-common/tx-simulation';

import {
    TxSimulationBanner,
    type TxSimulationBannerProps,
} from '../../common/components/TxSimulationBanner';

export type StellarTxSimulationDisclaimerProps = {
    result: TxSimulationStellarResult;
} & Pick<TxSimulationBannerProps, 'isAccepted' | 'onChange'>;

export function StellarTxSimulationDisclaimer({
    result: { simulation, validation },
    isAccepted,
    onChange,
}: StellarTxSimulationDisclaimerProps) {
    if (simulation?.status === 'Error' || validation?.status === 'Error') {
        return (
            <TxSimulationBanner
                type="error"
                title="TR_SIMULATION_ERROR"
                isAccepted={isAccepted}
                onChange={onChange}
            />
        );
    }

    switch (validation && 'result_type' in validation ? validation.result_type : undefined) {
        case 'Malicious':
            return (
                <TxSimulationBanner
                    type="error"
                    title="TR_SIMULATION_MALICIOUS"
                    description="TR_SIMULATION_MALICIOUS_DESC"
                    isAccepted={isAccepted}
                    onChange={onChange}
                />
            );
        case 'Warning':
            return (
                <TxSimulationBanner
                    type="warning"
                    title="TR_SIMULATION_WARNING"
                    description="TR_SIMULATION_WARNING_DESC"
                    isAccepted={isAccepted}
                    onChange={onChange}
                />
            );

        default:
            return null;
    }
}
