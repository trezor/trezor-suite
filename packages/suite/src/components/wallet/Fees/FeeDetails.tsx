import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { spacingsPx, typography } from '@trezor/theme';
import { FeeLevel } from '@trezor/connect';
import { Translation } from 'src/components/suite';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { formatDuration } from '@suite-common/suite-utils';
import { Network } from 'src/types/wallet';
import {
    FeeInfo,
    PrecomposedTransaction,
    PrecomposedTransactionCardano,
} from 'src/types/wallet/sendForm';

const Wrapper = styled.div`
    display: flex;
    align-items: baseline;
    gap: ${spacingsPx.sm};
    ${typography.hint}
`;

const Label = styled.span`
    color: ${({ theme }) => theme.textSubdued};
    padding-right: ${spacingsPx.xxs};
`;

// set min-width to prevent jumping when changing amount, width to fit 6 digits
const FeeItem = styled.span`
    min-width: 42px;
    display: inline-block;
`;

interface DetailsProps {
    networkType: Network['networkType'];
    selectedLevel: FeeLevel;
    // fields below are validated as false-positives, eslint claims that they are not used...

    feeInfo: FeeInfo;

    transactionInfo?: PrecomposedTransaction | PrecomposedTransactionCardano;
}

const BitcoinDetails = ({ networkType, feeInfo, selectedLevel, transactionInfo }: DetailsProps) => (
    <Wrapper>
        <span>
            <Label>
                <Translation id="ESTIMATED_TIME" />:
            </Label>
            {formatDuration(feeInfo.blockTime * selectedLevel.blocks * 60)}
        </span>

        <span>
            <Label>
                <Translation id="TR_FEE_RATE" />:
            </Label>
            {`${
                transactionInfo && transactionInfo.type !== 'error'
                    ? transactionInfo.feePerByte
                    : selectedLevel.feePerUnit
            } ${getFeeUnits(networkType)}`}
        </span>

        {transactionInfo && transactionInfo.type !== 'error' && (
            <span>({transactionInfo.bytes} B)</span>
        )}
    </Wrapper>
);

const EthereumDetails = ({ networkType, selectedLevel, transactionInfo }: DetailsProps) => {
    const [fee, setFee] = useState<string | undefined>(selectedLevel.feeLimit);

    const isComposedTx = transactionInfo && transactionInfo.type !== 'error';

    useEffect(() => {
        if (isComposedTx) {
            setFee(transactionInfo.feeLimit);
        }
    }, [isComposedTx, transactionInfo]);

    return (
        <Wrapper>
            <span>
                <Label>
                    <Translation id="TR_GAS_LIMIT" />:
                </Label>
                <FeeItem>{isComposedTx ? transactionInfo.feeLimit : fee}</FeeItem>
            </span>

            <span>
                <Label>
                    <Translation id="TR_GAS_PRICE" />:
                </Label>
                <FeeItem>{`${selectedLevel.feePerUnit} ${getFeeUnits(networkType)}`}</FeeItem>
            </span>
        </Wrapper>
    );
};

const RippleDetails = ({ networkType, selectedLevel }: DetailsProps) => (
    <Wrapper>
        <span>{`${selectedLevel.feePerUnit}: ${getFeeUnits(networkType)}`}</span>
    </Wrapper>
);

export const FeeDetails = (props: DetailsProps) => {
    const { networkType } = props;
    if (networkType === 'bitcoin') return <BitcoinDetails {...props} />;
    if (networkType === 'ethereum') return <EthereumDetails {...props} />;
    if (networkType === 'ripple') return <RippleDetails {...props} />;
    return null;
};
