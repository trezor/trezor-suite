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
    display: inline-flex;
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

    showFee: boolean;
}

const BitcoinDetails = ({
    networkType,
    feeInfo,
    selectedLevel,
    transactionInfo,
    showFee,
}: DetailsProps) => (
    <Wrapper>
        {showFee && (
            <>
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
            </>
        )}
    </Wrapper>
);

const EthereumDetails = ({
    networkType,
    selectedLevel,
    transactionInfo,
    showFee,
}: DetailsProps) => {
    const isComposedTx = transactionInfo && transactionInfo.type !== 'error';
    const gasLimit = isComposedTx ? transactionInfo.feeLimit : selectedLevel.feeLimit;
    const gasPrice = isComposedTx ? transactionInfo.feePerByte : selectedLevel.feePerUnit;

    return (
        <Wrapper>
            {showFee && (
                <>
                    <span>
                        <Label>
                            <Translation id="TR_GAS_LIMIT" />:
                        </Label>
                        <FeeItem>{gasLimit}</FeeItem>
                    </span>

                    <span>
                        <Label>
                            <Translation id="TR_GAS_PRICE" />:
                        </Label>
                        <FeeItem>
                            {gasPrice} {getFeeUnits(networkType)}
                        </FeeItem>
                    </span>
                </>
            )}
        </Wrapper>
    );
};

const RippleDetails = ({ networkType, selectedLevel, showFee }: DetailsProps) => (
    <Wrapper>
        {showFee && <span>{`${selectedLevel.feePerUnit}: ${getFeeUnits(networkType)}`}</span>}
    </Wrapper>
);

export const FeeDetails = (props: DetailsProps) => {
    const { networkType } = props;
    if (networkType === 'bitcoin') return <BitcoinDetails {...props} />;
    if (networkType === 'ethereum') return <EthereumDetails {...props} />;
    if (networkType === 'ripple') return <RippleDetails {...props} />;

    return null;
};
