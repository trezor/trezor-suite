import {
    type TxSimulationEVMResult,
    getSimulationErrorRiskLevel,
} from '@suite-common/tx-simulation';

import {
    TxSimulationBanner,
    type TxSimulationBannerProps,
} from '../../common/components/TxSimulationBanner';

export type EvmTxSimulationDisclaimerProps = {
    result: TxSimulationEVMResult;
} & Pick<TxSimulationBannerProps, 'isAccepted' | 'onChange'>;

export function EvmTxSimulationDisclaimer({
    result,
    isAccepted,
    onChange,
}: EvmTxSimulationDisclaimerProps) {
    if (result.simulation?.status === 'Error') {
        return (
            <TxSimulationBanner
                type={getSimulationErrorRiskLevel(result.simulation.error)}
                title="TR_SIMULATION_ERROR"
                description="TR_SIMULATION_ERROR_DESC"
                isAccepted={isAccepted}
                onChange={onChange}
            />
        );
    }

    switch (result.validation?.result_type) {
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
