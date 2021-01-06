import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation, FormattedCryptoAmount } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';

import Summary from './Summary';
import Indicator, { Props as IndicatorProps } from './Indicator';
import { Account } from '@wallet-types';
import { FormState, PrecomposedTransactionFinal } from '@wallet-types/sendForm';

const Content = styled.div`
    display: flex;
    padding: 20px;
`;

const Right = styled.div`
    flex: 1;
    margin: 20px 0 10px 40px;
    max-width: 435px;
`;

const RightTop = styled.div`
    flex: 1;
`;

const RightBottom = styled.div`
    margin: 20px 0 0 50px;
    padding: 20px 0 0 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const Step = styled.div`
    display: flex;
    padding: 0 20px 0 0;
    & + & {
        margin-top: 20px;
    }
`;

const StepHeadline = styled.div`
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 2px;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const StepTransaction = styled.div`
    font-size: 12px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    word-break: break-word;
    font-weight: 500;
`;

const StepAmount = styled.div`
    font-size: 12px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: 500;
    & + & {
        margin-top: 20px;
    }
`;

const StepValue = styled.div`
    font-size: 14px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: 500;
`;

const StepLeft = styled.div`
    display: flex;
    width: 50px;
    margin-top: -5px;
`;

const StepRight = styled.div`
    flex: 1;
    text-align: left;
`;

const StyledButton = styled(Button)`
    display: flex;
    align-self: center;
    width: 100%;
`;

const DualIndicatorWrapper = styled.div`
    display: flex;
    align-self: center;
    height: 60px;
    align-items: center;
    position: relative;
    z-index: 1;

    &:after {
        z-index: -2;
        width: 10px;
        left: 10px;
        position: absolute;
        height: 100%;
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
        border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
        border-left: 1px solid ${props => props.theme.STROKE_GREY};
        content: '';
        display: block;
    }
    &:before {
        z-index: -1;
        width: 20px;
        background: ${props => props.theme.BG_WHITE};
        position: absolute;
        height: 50%;
        content: '';
        display: block;
    }
`;

interface Props {
    activeStep: number;
    account: Account;
    precomposedForm: FormState;
    precomposedTx: PrecomposedTransactionFinal;
    signedTx?: { tx: string }; // send reducer
    decision?: { resolve: (success: boolean) => any }; // dfd
}

const ChangeFee = ({
    activeStep,
    account,
    precomposedForm,
    precomposedTx,
    signedTx,
    decision,
}: Props) => {
    const { symbol } = account;

    const state: { [key: string]: IndicatorProps['state'] } = { txid: 'active', fee: undefined };
    if (activeStep > 1) {
        state.txid = 'success';
        state.fee = activeStep > 2 ? 'success' : 'active';
    }

    const diff = new BigNumber(precomposedTx.fee)
        .minus(precomposedForm.rbfParams?.baseFee || 0)
        .toFixed();

    return (
        <Content>
            <Summary account={account} feeRate={precomposedTx.feePerByte} rbf={precomposedTx.rbf} />
            <Right>
                <RightTop>
                    <Step>
                        <StepLeft>
                            <Indicator state={state.txid} size={16} />
                        </StepLeft>
                        <StepRight>
                            <StepHeadline>
                                <Translation id="TR_TRANSACTION_ID" />
                            </StepHeadline>
                            <StepTransaction>{precomposedTx.prevTxid}</StepTransaction>
                        </StepRight>
                    </Step>
                    <Step>
                        <StepLeft>
                            <DualIndicatorWrapper>
                                <Indicator size={16} state={state.fee} />
                            </DualIndicatorWrapper>
                        </StepLeft>
                        <StepRight>
                            <StepAmount>
                                <StepHeadline>
                                    <Translation id="TR_INCREASE_FEE_BY" />
                                </StepHeadline>
                                <StepValue>
                                    <FormattedCryptoAmount
                                        disableHiddenPlaceholder
                                        value={formatNetworkAmount(diff, symbol)}
                                        symbol={symbol}
                                    />
                                </StepValue>
                            </StepAmount>
                            <StepAmount>
                                <StepHeadline>
                                    <Translation id="TR_INCREASED_FEE" />
                                </StepHeadline>
                                <StepValue>
                                    <FormattedCryptoAmount
                                        disableHiddenPlaceholder
                                        value={formatNetworkAmount(precomposedTx.fee, symbol)}
                                        symbol={symbol}
                                    />
                                </StepValue>
                            </StepAmount>
                        </StepRight>
                    </Step>
                </RightTop>
                <RightBottom>
                    <StyledButton
                        variant="primary"
                        isDisabled={!signedTx}
                        onClick={() => {
                            if (decision) decision.resolve(true);
                        }}
                    >
                        <Translation id="SEND_TRANSACTION" />
                    </StyledButton>
                </RightBottom>
            </Right>
        </Content>
    );
};

export default ChangeFee;
