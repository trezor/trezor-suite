import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FeeLevel } from '@trezor/connect';
import { variables } from '@trezor/components';
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
    flex-wrap: wrap;
    min-width: 150px;

    > * {
        padding-right: 8px;
    }
`;

const Item = styled.span`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Label = styled.span`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding-right: 8px;
`;

// set min-width to prevent jumping when changing amount, width to fit 6 digits
const FeeItem = styled.span`
    min-width: 42px;
    display: inline-block;
`;

interface Props {
    networkType: Network['networkType'];
    selectedLevel: FeeLevel;
    // fields below are validated as false-positives, eslint claims that they are not used...
    // eslint-disable-next-line react/no-unused-prop-types
    feeInfo: FeeInfo;
    // eslint-disable-next-line react/no-unused-prop-types
    transactionInfo?: PrecomposedTransaction | PrecomposedTransactionCardano;
}

const BitcoinDetails = ({ networkType, feeInfo, selectedLevel, transactionInfo }: Props) => (
    <Wrapper>
        <Item>
            <Label>
                <Translation id="ESTIMATED_TIME" />
            </Label>
            {formatDuration(feeInfo.blockTime * selectedLevel.blocks * 60)}
        </Item>
        <Item>
            <Label>
                <Translation id="TR_FEE_RATE" />
            </Label>
            {`${
                transactionInfo && transactionInfo.type !== 'error'
                    ? transactionInfo.feePerByte
                    : selectedLevel.feePerUnit
            } ${getFeeUnits(networkType)}`}
        </Item>
        {transactionInfo && transactionInfo.type !== 'error' && (
            <Item>({transactionInfo.bytes} B)</Item>
        )}
    </Wrapper>
);

const EthereumDetails = ({ networkType, selectedLevel, transactionInfo }: Props) => {
    const [fee, setFee] = useState<string | undefined>(selectedLevel.feeLimit);

    const isComposedTx = transactionInfo && transactionInfo.type !== 'error';

    useEffect(() => {
        if (isComposedTx) {
            setFee(transactionInfo.feeLimit);
        }
    }, [isComposedTx, transactionInfo]);

    return (
        <Wrapper>
            <Item>
                <Label>
                    <Translation id="TR_GAS_LIMIT" />
                </Label>
                <FeeItem>{isComposedTx ? transactionInfo.feeLimit : fee}</FeeItem>
            </Item>
            <Item>
                <Label>
                    <Translation id="TR_GAS_PRICE" />
                </Label>
                <FeeItem>{`${selectedLevel.feePerUnit} ${getFeeUnits(networkType)}`}</FeeItem>
            </Item>
        </Wrapper>
    );
};

const RippleDetails = ({ networkType, selectedLevel }: Props) => (
    <Wrapper>
        <Item>{`${selectedLevel.feePerUnit} ${getFeeUnits(networkType)}`}</Item>
    </Wrapper>
);

const FeeDetails = (props: Props) => {
    const { networkType } = props;
    if (networkType === 'bitcoin') return <BitcoinDetails {...props} />;
    if (networkType === 'ethereum') return <EthereumDetails {...props} />;
    if (networkType === 'ripple') return <RippleDetails {...props} />;
    return null;
};

export default FeeDetails;
