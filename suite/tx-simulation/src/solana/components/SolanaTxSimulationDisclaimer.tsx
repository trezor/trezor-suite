import {
    type TxSimulationSolanaResult,
    getSolanaSimulationFailure,
} from '@suite-common/tx-simulation';

import {
    TxSimulationBanner,
    type TxSimulationBannerProps,
} from '../../common/components/TxSimulationBanner';

export type SolanaTxSimulationDisclaimerProps = {
    result: TxSimulationSolanaResult;
} & Pick<TxSimulationBannerProps, 'isAccepted' | 'onChange'>;

export function SolanaTxSimulationDisclaimer({
    result,
    isAccepted,
    onChange,
}: SolanaTxSimulationDisclaimerProps) {
    if (getSolanaSimulationFailure(result)) {
        return (
            <TxSimulationBanner
                type="error"
                title="TR_SIMULATION_ERROR"
                isAccepted={isAccepted}
                onChange={onChange}
            />
        );
    }

    switch (result.result?.validation?.result_type) {
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
