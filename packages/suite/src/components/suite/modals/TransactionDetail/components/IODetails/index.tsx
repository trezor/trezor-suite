import React from 'react';
import styled from 'styled-components';
import { Icon, colors, variables, Loader } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { FormattedCryptoAmount } from '@suite-components';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

const IOWrapper = styled.div``;

const IconWrapper = styled.div`
    display: flex;
    justify-self: left;
    width: 100%;
    margin-top: 16px;
    margin-bottom: 16px;
`;

const IOBox = styled.div``;

const IORowTitle = styled.div`
    margin-bottom: 4px;
    color: ${colors.BLACK50};
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
`;

const IORow = styled.div`
    display: flex;
    line-height: 1.9;
    color: ${colors.BLACK25};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
`;

const Address = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
`;

const Circle = styled.div`
    margin-left: 5px;
    margin-right: 5px;
    color: ${colors.BLACK50};
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
            {/* If i have inputs and ouputs, render this: */}
            {txDetails?.vin && txDetails?.vout && (
                <IOWrapper>
                    <IOBox>
                        <IORowTitle>Inputs</IORowTitle>

                        {txDetails.vin?.map((input: any) => {
                            let inputAmount = formatNetworkAmount(input.value, tx.symbol);

                            // if the input amount is equal to -1, return 0, otherwise return input amount
                            inputAmount = inputAmount === '-1' ? '0' : inputAmount;
                            return (
                                <IORow key={input.n}>
                                    <FormattedCryptoAmount value={inputAmount} symbol={tx.symbol} />
                                    <Circle>&bull;</Circle>
                                    <Address>{input.addresses.map((addr: string) => addr)}</Address>
                                </IORow>
                            );
                        })}
                    </IOBox>

                    <IconWrapper>
                        <Icon icon="ARROW_DOWN" size={17} color={colors.BLACK50} />
                    </IconWrapper>

                    <IOBox>
                        <IORowTitle>Outputs</IORowTitle>
                        {txDetails.vout?.map((output: any) => {
                            let outputAmount = formatNetworkAmount(output.value, tx.symbol);
                            outputAmount = outputAmount === '-1' ? '0' : outputAmount;
                            return (
                                <IORow key={output.n}>
                                    <FormattedCryptoAmount
                                        value={outputAmount}
                                        symbol={tx.symbol}
                                    />
                                    <Circle>&bull;</Circle>
                                    <Address>
                                        {output.addresses.map((addr: string) => addr)}
                                    </Address>
                                </IORow>
                            );
                        })}
                    </IOBox>
                </IOWrapper>
            )}
        </Wrapper>
    );
};

export default IODetails;
