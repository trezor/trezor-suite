import { type TxSimulationBannerProps } from '@suite/tx-simulation/src/common';
import { EvmTxSimulationDisclaimer } from '@suite/tx-simulation/src/evm';
import { SolanaTxSimulationDisclaimer } from '@suite/tx-simulation/src/solana';
import { StellarTxSimulationDisclaimer } from '@suite/tx-simulation/src/stellar';
import { type NetworkTxSimulationResult } from '@suite-common/tx-simulation';

export type TxSimulationDisclaimerProps = {
    result: NetworkTxSimulationResult;
} & Pick<TxSimulationBannerProps, 'isAccepted' | 'onChange'>;

export function TxSimulationDisclaimer({
    result: { method, payload },
    isAccepted,
    onChange,
}: TxSimulationDisclaimerProps) {
    switch (method) {
        case 'ethereumSignTransaction':
        case 'ethereumSignTypedData':
            return (
                <EvmTxSimulationDisclaimer
                    result={payload}
                    isAccepted={isAccepted}
                    onChange={onChange}
                />
            );

        case 'solanaSignTransaction':
            return (
                <SolanaTxSimulationDisclaimer
                    result={payload}
                    isAccepted={isAccepted}
                    onChange={onChange}
                />
            );

        case 'stellarSignTransaction':
            return (
                <StellarTxSimulationDisclaimer
                    result={payload}
                    isAccepted={isAccepted}
                    onChange={onChange}
                />
            );

        default:
            return null;
    }
}
