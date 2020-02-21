import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables, Loader } from '@trezor/components-v2';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import FiatValue from '@suite-components/FiatValue/Container';
import Badge from '@suite-components/Badge';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Col = styled.div<{ direction: 'column' | 'row' }>`
    display: flex;
    flex-direction: ${props => props.direction};
    flex: 1 1 calc(50% - 16px);
    overflow: hidden;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    padding: 8px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
        justify-content: center;
        transform: rotate(90deg);
    }
`;

const IOBox = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 3px;
    background-color: ${colors.BLACK96};
    padding: 12px;
    text-align: left;

    & + & {
        margin-top: 10px;
    }

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

// const IOBoxPath = styled.div`
//     display: flex;
//     font-size: ${variables.FONT_SIZE.TINY};
//     color: ${colors.BLACK50};
//     margin-bottom: 10px;
// `;

const IOBoxAmountWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Amount = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const IOBoxAddress = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK17};
    overflow: hidden;
    text-overflow: ellipsis;

    margin-bottom: 10px;
`;

interface Props {
    tx: WalletAccountTransaction;
    txDetails: any;
    isFetching: boolean;
}

const IODetails = ({ tx, txDetails, isFetching }: Props) => {
    return (
        <Wrapper>
            {!txDetails && isFetching && <Loader size={32} />}
            {txDetails?.vin && txDetails?.vout && (
                <>
                    <Col direction="column">
                        {txDetails.vin?.map((input: any) => {
                            let inputAmount = formatNetworkAmount(input.value, tx.symbol);
                            inputAmount = inputAmount === '-1' ? '0' : inputAmount;
                            return (
                                <IOBox key={input.hex}>
                                    <IOBoxAddress>
                                        {input.addresses.map((addr: string) => addr)}
                                    </IOBoxAddress>
                                    {/* <IOBoxPath>placeholder</IOBoxPath> */}
                                    <IOBoxAmountWrapper>
                                        <Amount>{`${inputAmount} ${tx.symbol.toUpperCase()}`}</Amount>
                                        <Badge>
                                            <FiatValue amount={inputAmount} symbol={tx.symbol}>
                                                {({ value }) => value}
                                            </FiatValue>
                                        </Badge>
                                    </IOBoxAmountWrapper>
                                </IOBox>
                            );
                        })}
                    </Col>

                    <IconWrapper>
                        <Icon icon="ARROW_RIGHT" size={16} />
                    </IconWrapper>

                    <Col direction="column">
                        {txDetails.vout?.map((output: any) => {
                            let outputAmount = formatNetworkAmount(output.value, tx.symbol);
                            outputAmount = outputAmount === '-1' ? '0' : outputAmount;
                            return (
                                <IOBox key={output.hex}>
                                    <IOBoxAddress>
                                        {output.addresses.map((addr: string) => addr)}
                                    </IOBoxAddress>
                                    {/* <IOBoxPath>todo: bip44 path</IOBoxPath> */}
                                    <IOBoxAmountWrapper>
                                        <Amount>{`${outputAmount} ${tx.symbol.toUpperCase()}`}</Amount>
                                        <Badge>
                                            <FiatValue amount={outputAmount} symbol={tx.symbol}>
                                                {({ value }) => value}
                                            </FiatValue>
                                        </Badge>
                                    </IOBoxAmountWrapper>
                                </IOBox>
                            );
                        })}
                    </Col>
                </>
            )}
        </Wrapper>
    );
};

export default IODetails;
