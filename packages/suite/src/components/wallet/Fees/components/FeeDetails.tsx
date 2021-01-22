import React from 'react';
import styled from 'styled-components';
import { FeeLevel } from 'trezor-connect';
import { variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { getFeeUnits } from '@wallet-utils/sendFormUtils';
import { Network } from '@wallet-types';
import { FeeInfo, PrecomposedTransaction } from '@wallet-types/sendForm';
import EstimatedMiningTime from './EstimatedMiningTime';

const Wrapper = styled.div`
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    min-width: 150px;
`;

const EstimatedMiningTimeWrapper = styled.span`
    padding-right: 4px;
`;

const FeeUnits = styled.span`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TxSize = styled(FeeUnits)`
    padding-left: 4px;
`;

interface Props {
    networkType: Network['networkType'];
    selectedLevel: FeeLevel;
    // fields below are validated as false-positives, eslint claims that they are not used...
    // eslint-disable-next-line react/no-unused-prop-types
    feeInfo: FeeInfo;
    // eslint-disable-next-line react/no-unused-prop-types
    transactionInfo?: PrecomposedTransaction;
}

const BitcoinDetails = ({ networkType, feeInfo, selectedLevel }: Props) => {
    return (
        <Wrapper>
            <EstimatedMiningTimeWrapper>
                <EstimatedMiningTime seconds={feeInfo.blockTime * selectedLevel.blocks * 60} />
            </EstimatedMiningTimeWrapper>
            <FeeUnits>{`${selectedLevel.feePerUnit} ${getFeeUnits(networkType)}`}</FeeUnits>
        </Wrapper>
    );
};

const EthereumDetails = ({ networkType, selectedLevel, transactionInfo }: Props) => {
    return (
        <Wrapper>
            <FeeUnits>
                <Translation id="TR_GAS_PRICE" />
                {` ${selectedLevel.feePerUnit} ${getFeeUnits(networkType)}`}
            </FeeUnits>
            <TxSize>
                <Translation id="TR_GAS_LIMIT" />{' '}
                {transactionInfo && transactionInfo.type !== 'error'
                    ? transactionInfo.feeLimit
                    : selectedLevel.feeLimit}
            </TxSize>
        </Wrapper>
    );
};

const RippleDetails = ({ networkType, selectedLevel }: Props) => {
    return (
        <Wrapper>
            <FeeUnits>{`${selectedLevel.feePerUnit} ${getFeeUnits(networkType)}`}</FeeUnits>
        </Wrapper>
    );
};

const FeeDetails = (props: Props) => {
    const { networkType } = props;
    if (networkType === 'bitcoin') return <BitcoinDetails {...props} />;
    if (networkType === 'ethereum') return <EthereumDetails {...props} />;
    if (networkType === 'ripple') return <RippleDetails {...props} />;
    return null;
};

export default FeeDetails;
