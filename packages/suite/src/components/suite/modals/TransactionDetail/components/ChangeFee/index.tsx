import React from 'react';
import styled from 'styled-components';
import { Card, Icon, variables } from '@trezor/components';
import { Translation, FiatValue, FormattedCryptoAmount } from 'src/components/suite';
import { useRbf, RbfContext, UseRbfProps } from 'src/hooks/wallet/useRbfForm';
import { formatNetworkAmount, getFeeUnits } from '@suite-common/wallet-utils';
import Fees from './components/Fees';
import AffectedTransactions from './components/AffectedTransactions';
import DecreasedOutputs from './components/DecreasedOutputs';
import ReplaceButton from './components/ReplaceButton';

const Wrapper = styled.div`
    margin: 12px 0;
`;

const Box = styled.div`
    display: flex;
    flex-direction: column;
    padding: 18px 26px;
    border: 1px solid ${props => props.theme.STROKE_GREY};
    border-radius: 8px;
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
    margin: 1px 20px 0 0;
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
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

const FinalizeWarning = styled(Card)`
    display: flex;
    flex-direction: row;
    width: 100%;
    padding: 12px 0px;
    margin-top: 16px;
    text-align: center;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    background: ${props => props.theme.BG_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const InfoIcon = styled(Icon)`
    margin-right: 8px;
`;

const Red = styled.span`
    margin-left: 2px;
    color: ${props => props.theme.TYPE_RED};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
`;

/* children are only for test purposes, this prop is not available in regular build */
interface ChangeFeeProps extends UseRbfProps {
    children?: React.ReactNode;
    showChained: () => void;
}

export const ChangeFee = (props: ChangeFeeProps) => {
    const contextValues = useRbf(props);
    if (!contextValues.account) return null; // context without account, should never happen
    const { tx } = props;
    const { networkType } = contextValues.account;
    const feeRate =
        networkType === 'bitcoin' ? `${tx.rbfParams?.feeRate} ${getFeeUnits(networkType)}` : null;
    const fee = formatNetworkAmount(tx.fee, tx.symbol);

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
                                <Rate>{feeRate}</Rate>
                                <Amount>
                                    <StyledCryptoAmount>
                                        <FormattedCryptoAmount
                                            disableHiddenPlaceholder
                                            value={fee}
                                            symbol={tx.symbol}
                                        />
                                    </StyledCryptoAmount>
                                    <StyledFiatValue>
                                        <FiatValue
                                            disableHiddenPlaceholder
                                            amount={fee}
                                            symbol={tx.symbol}
                                        />
                                    </StyledFiatValue>
                                </Amount>
                            </RateWrapper>
                        </Content>
                    </Inner>
                    <Inner>
                        <Fees />
                    </Inner>
                    <DecreasedOutputs />
                    {contextValues.chainedTxs.length > 0 && (
                        <AffectedTransactions showChained={props.showChained} />
                    )}
                </Box>
                {props.finalize && (
                    <FinalizeWarning>
                        <InfoIcon icon="INFO" size={16} />
                        <Translation
                            id="TR_FINALIZE_TS_RBF_OFF_WARN"
                            values={{ strong: chunks => <Red>{chunks}</Red> }}
                        />
                    </FinalizeWarning>
                )}
                <ReplaceButton finalize={props.finalize} />

                {props.children}
            </Wrapper>
        </RbfContext.Provider>
    );
};
