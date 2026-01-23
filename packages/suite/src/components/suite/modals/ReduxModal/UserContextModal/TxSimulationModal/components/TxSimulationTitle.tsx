import { Translation } from '@suite/intl';

interface TxSimulationTitleProps {
    isEthereumSigningTypedData: boolean;
}

export function TxSimulationTitle({ isEthereumSigningTypedData }: TxSimulationTitleProps) {
    if (isEthereumSigningTypedData) {
        return <Translation id="TR_SIGN_EIP712_TYPED_DATA" />;
    }

    return <Translation id="TR_REVIEW_TRANSACTION" />;
}
