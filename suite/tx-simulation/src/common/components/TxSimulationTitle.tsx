import { Translation } from '@suite/intl';
import { type TxSimulationAction } from '@suite-common/wallet-types';

interface TxSimulationTitleProps {
    method: TxSimulationAction['method'];
}

export function TxSimulationTitle({ method }: TxSimulationTitleProps) {
    if (method === 'ethereumSignTypedData') {
        return <Translation id="TR_SIGN_EIP712_TYPED_DATA" />;
    }

    return <Translation id="TR_REVIEW_TRANSACTION" />;
}
