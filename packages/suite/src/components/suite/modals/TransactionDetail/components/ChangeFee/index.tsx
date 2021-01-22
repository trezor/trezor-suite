import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation, FiatValue, FormattedCryptoAmount } from '@suite-components';
import { WalletAccountTransaction } from '@wallet-types';
import { useRbf, RbfContext } from '@wallet-hooks/useRbfForm';
import { getFeeUnits } from '@wallet-utils/sendFormUtils';
import Fees from './components/Fees';
import ReplaceButton from './components/ReplaceButton';

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

const RateWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
`;

const Rate = styled.div`
    margin: 3px 20px 5px 0;
    font-size: ${variables.NEUE_FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Amount = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
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

interface Props {
    tx: WalletAccountTransaction;
    finalize: boolean;
}

const ChangeFee = ({ tx, finalize }: Props) => {
    const contextValues = useRbf(tx, finalize);
    if (!contextValues.account) return null; // context without account, should never happen

    return (
        <RbfContext.Provider value={contextValues}>
            <Wrapper>
                <Box>
                    <Inner>
                        <Title>
                            <Translation id="TR_CURRENT_FEE" />
                        </Title>
                        <Content>
                            <RateWrapper>
                                <Rate>
                                    {tx.rbfParams?.feeRate} {getFeeUnits('bitcoin')}
                                </Rate>
                                <Amount>
                                    <StyledCryptoAmount>
                                        <FormattedCryptoAmount value={tx.fee} symbol={tx.symbol} />
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
                            </RateWrapper>
                        </Content>
                    </Inner>
                    <Inner>
                        <Fees />
                    </Inner>
                </Box>
                <ReplaceButton finalize={finalize} />
            </Wrapper>
        </RbfContext.Provider>
    );
};

export default ChangeFee;
