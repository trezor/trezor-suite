import React from 'react';
import styled from 'styled-components';
import { Translation, FormattedCryptoAmount, FiatValue } from '@suite-components';
import { Button, variables } from '@trezor/components';
import { WalletAccountTransaction } from '@wallet-types';
import { useRbf, RbfContext } from '@wallet-hooks/useRbfForm';
import Fees from './components/Fees';

const Wrapper = styled.div`
    padding: 24px 0 14px;
`;

const Box = styled.div`
    display: flex;
    flex-direction: column;
    padding: 22px 20px 20px 27px;
    border: 1px solid ${props => props.theme.STROKE_GREY};
    border-radius: 6px;
`;

const Inner = styled.div`
    display: flex;
    & + & {
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
        margin-top: 28px;
        padding-top: 22px;
    }
`;

const Title = styled.div`
    width: 100px;
    padding-right: 20px;
    text-align: left;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Content = styled.div`
    flex: 1;
    text-align: left;
`;

const Rate = styled.div`
    margin-top: 3px;
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Amount = styled.div`
    display: flex;
    text-align: right;
    flex-direction: column;
    margin-left: 10px;
    flex: 1;
    & * + * {
        margin-top: 6px;
    }
`;

const StyledCryptoAmount = styled.div`
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledFiatValue = styled.div`
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Submit = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 22px;
`;

const SubmitInner = styled.div`
    width: 30%;
`;

interface Props {
    tx: WalletAccountTransaction;
}

const ChangeFee = ({ tx }: Props) => {
    const contextValues = useRbf(tx);
    if (!contextValues.account) return null; // do not render if contextValues.state is not present

    return (
        <Wrapper>
            <Box>
                <Inner>
                    <Title>
                        <Translation id="TR_CURRENT" />
                    </Title>
                    <Content>
                        <Rate>1sat/B</Rate>
                    </Content>
                    <Amount>
                        <StyledCryptoAmount>{tx.fee}</StyledCryptoAmount>
                        {tx.rates && (
                            <StyledFiatValue>
                                <FiatValue
                                    amount={tx.amount}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            </StyledFiatValue>
                        )}
                    </Amount>
                </Inner>
                <Inner>
                    <Title>
                        <Translation id="TR_NEW" />
                    </Title>
                    <Content>
                        <RbfContext.Provider value={contextValues}>
                            <Fees />
                        </RbfContext.Provider>
                    </Content>
                    <Amount>
                        <StyledCryptoAmount>
                            <FormattedCryptoAmount value={tx.amount} symbol={tx.symbol} />
                        </StyledCryptoAmount>
                        {tx.rates && (
                            <StyledFiatValue>
                                <FiatValue
                                    amount={tx.amount}
                                    symbol={tx.symbol}
                                    source={tx.rates}
                                    useCustomSource
                                />
                            </StyledFiatValue>
                        )}
                    </Amount>
                </Inner>
            </Box>
            <Submit>
                <SubmitInner>
                    <Button onClick={contextValues.sign} fullWidth>
                        <Translation id="TR_CHANGE_FEE" />
                    </Button>
                </SubmitInner>
            </Submit>
        </Wrapper>
    );
};

export default ChangeFee;
