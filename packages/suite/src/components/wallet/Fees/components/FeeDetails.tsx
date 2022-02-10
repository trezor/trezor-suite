import React from 'react';
import styled from 'styled-components';
import { FeeLevel } from 'trezor-connect';
import { variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { getFeeUnits } from '@wallet-utils/sendFormUtils';
import { formatDuration } from '@suite-utils/date';
import { Network } from '@wallet-types';
import {
    FeeInfo,
    PrecomposedTransaction,
    PrecomposedTransactionCardano,
} from '@wallet-types/sendForm';

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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Label = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding-right: 8px;
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

const EthereumDetails = ({ networkType, selectedLevel, transactionInfo }: Props) => (
    <Wrapper>
        <Item>
            <Label>
                <Translation id="TR_GAS_LIMIT" />
            </Label>
            {transactionInfo && transactionInfo.type !== 'error'
                ? transactionInfo.feeLimit
                : selectedLevel.feeLimit}
        </Item>
        <Item>
            <Label>
                <Translation id="TR_GAS_PRICE" />
            </Label>
            {`${selectedLevel.feePerUnit} ${getFeeUnits(networkType)}`}
        </Item>
    </Wrapper>
);

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
