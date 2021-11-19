import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Translation, AccountLabeling } from '@suite-components';
import { Button, Loader, P, RadioButton, Truncate, variables } from '@trezor/components';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import { DexApprovalType, ExchangeTrade } from 'invity-api';
import useTimeoutFn from 'react-use/lib/useTimeoutFn';
import useUnmount from 'react-use/lib/useUnmount';
import invityAPI from '@suite-services/invityAPI';

// add APPROVED means no approval request is necessary
type ExtendedDexApprovalType = DexApprovalType | 'APPROVED';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const LabelText = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Value = styled.div`
    padding-top: 6px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const BreakableValue = styled(Value)`
    word-break: break-all;
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin: 20px 0;
`;

const Row = styled.div`
    margin: 10px 24px;
`;

const RadioButtonInner = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-center;
    justify-self: center;
`;

const Address = styled.div``;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const LoaderWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px 60px 20px;
    flex-direction: column;
`;

const ErrorWrapper = styled(LoaderWrapper)`
    color: ${props => props.theme.TYPE_RED};
`;

const REFRESH_SECONDS = 15;

const shouldRefresh = (quote?: ExchangeTrade) => quote?.status === 'APPROVAL_PENDING';

const SendApprovalTransactionComponent = () => {
    const {
        account,
        callInProgress,
        selectedQuote,
        setSelectedQuote,
        exchangeInfo,
        confirmTrade,
        sendTransaction,
        setExchangeStep,
    } = useCoinmarketExchangeOffersContext();
    const [approvalType, setApprovalType] = useState<ExtendedDexApprovalType>(
        selectedQuote?.status === 'CONFIRM' ? 'APPROVED' : 'MINIMAL',
    );

    // watch the trade if transaction in confirmation
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefresh(selectedQuote)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);
    useUnmount(() => {
        cancelRefresh();
    });
    useEffect(() => {
        if (selectedQuote && shouldRefresh(selectedQuote)) {
            cancelRefresh();
            invityAPI.watchExchangeTrade(selectedQuote, refreshCount).then(response => {
                if (response.status && response.status !== selectedQuote.status) {
                    selectedQuote.status = response.status;
                    selectedQuote.error = response.error;
                    selectedQuote.approvalType = undefined;
                    if (selectedQuote.dexTx) {
                        confirmTrade(selectedQuote.dexTx.from);
                    }
                }
                resetRefresh();
            });
        }
    }, [cancelRefresh, confirmTrade, refreshCount, resetRefresh, selectedQuote, setSelectedQuote]);

    const { navigateToExchangeForm } = useCoinmarketNavigation(account);

    if (!selectedQuote) return null;

    const { exchange, dexTx } = selectedQuote;
    if (!exchange || !dexTx) return null;

    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    const isFullApproval = !(Number(selectedQuote.preapprovedStringAmount) > 0);
    const isToken = selectedQuote.send !== account.symbol.toUpperCase();

    if (isFullApproval && approvalType === 'ZERO') {
        setApprovalType('MINIMAL');
    }

    const translationValues = {
        value: selectedQuote.approvalStringAmount,
        send: selectedQuote.send,
        provider: providerName,
    };

    const selectApprovalValue = (type: ExtendedDexApprovalType) => {
        setApprovalType(type);
        if (type !== 'APPROVED') {
            selectedQuote.approvalType = type;
            confirmTrade(dexTx.from);
        }
    };

    return (
        <Wrapper>
            <Row>
                <LabelText>
                    <Translation id="TR_EXCHANGE_SEND_FROM" />
                </LabelText>
                <Value>
                    <AccountLabeling account={account} />
                </Value>
            </Row>
            <Row>
                <LabelText>
                    <Translation
                        id={
                            approvalType === 'APPROVED'
                                ? 'TR_EXCHANGE_SWAP_SEND_TO'
                                : 'TR_EXCHANGE_APPROVAL_SEND_TO'
                        }
                        values={translationValues}
                    />
                </LabelText>
                <Value>
                    <Address>{dexTx.to}</Address>
                </Value>
            </Row>

            {selectedQuote.approvalSendTxHash && (
                <Row>
                    <LabelText>
                        <Translation id="TR_EXCHANGE_APPROVAL_TXID" />
                    </LabelText>
                    <Value>
                        <Address>{selectedQuote.approvalSendTxHash}</Address>
                    </Value>
                </Row>
            )}
            {selectedQuote.status === 'APPROVAL_PENDING' && (
                <LoaderWrapper>
                    <Loader />
                    <Title>
                        <Translation id="TR_EXCHANGE_APPROVAL_CONFIRMING" />
                    </Title>
                </LoaderWrapper>
            )}
            {selectedQuote.status === 'ERROR' && (
                <ErrorWrapper>
                    <Title>
                        <Translation id="TR_EXCHANGE_APPROVAL_FAILED" />
                    </Title>
                </ErrorWrapper>
            )}

            {(selectedQuote.status === 'APPROVAL_REQ' || selectedQuote.status === 'CONFIRM') && (
                <Row>
                    <LabelText>
                        <Translation id="TR_EXCHANGE_APPROVAL_VALUE" />
                    </LabelText>
                    {selectedQuote.status === 'APPROVAL_REQ' && (
                        <>
                            <Value>
                                <RadioButton
                                    isChecked={approvalType === 'MINIMAL'}
                                    onClick={() => selectApprovalValue('MINIMAL')}
                                >
                                    <RadioButtonInner>
                                        <>
                                            <P>
                                                <Translation
                                                    id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL"
                                                    values={translationValues}
                                                />
                                            </P>
                                            <LabelText>
                                                <Translation
                                                    id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO"
                                                    values={translationValues}
                                                />
                                            </LabelText>
                                        </>
                                    </RadioButtonInner>
                                </RadioButton>
                            </Value>
                            <Value>
                                <RadioButton
                                    isChecked={approvalType === 'INFINITE'}
                                    onClick={() => selectApprovalValue('INFINITE')}
                                >
                                    <RadioButtonInner>
                                        <P>
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE"
                                                values={translationValues}
                                            />
                                        </P>
                                        <LabelText>
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO"
                                                values={translationValues}
                                            />
                                        </LabelText>
                                    </RadioButtonInner>
                                </RadioButton>
                            </Value>
                        </>
                    )}
                    {selectedQuote.status !== 'APPROVAL_REQ' && (
                        <Value>
                            <RadioButton
                                isChecked={approvalType === 'APPROVED'}
                                onClick={() => selectApprovalValue('APPROVED')}
                            >
                                <RadioButtonInner>
                                    <P>
                                        {!isToken && (
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_NOT_REQUIRED"
                                                values={translationValues}
                                            />
                                        )}
                                        {isToken && selectedQuote.approvalSendTxHash && (
                                            <Translation id="TR_EXCHANGE_APPROVAL_SUCCESS" />
                                        )}
                                        {isToken && !selectedQuote.approvalSendTxHash && (
                                            <Translation id="TR_EXCHANGE_APPROVAL_PREAPPROVED" />
                                        )}
                                    </P>
                                    <LabelText>
                                        <Translation id="TR_EXCHANGE_APPROVAL_PROCEED" />
                                    </LabelText>
                                </RadioButtonInner>
                            </RadioButton>
                        </Value>
                    )}
                    {isToken && !isFullApproval && (
                        <Value>
                            <RadioButton
                                isChecked={approvalType === 'ZERO'}
                                onClick={() => selectApprovalValue('ZERO')}
                            >
                                <RadioButtonInner>
                                    <P>
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_ZERO"
                                            values={translationValues}
                                        />
                                    </P>
                                    <LabelText>
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_ZERO_INFO"
                                            values={translationValues}
                                        />
                                    </LabelText>
                                </RadioButtonInner>
                            </RadioButton>
                        </Value>
                    )}
                </Row>
            )}

            {dexTx.data && (selectedQuote.status !== 'CONFIRM' || approvalType === 'ZERO') && (
                <Row>
                    <LabelText>
                        <Translation id="TR_EXCHANGE_APPROVAL_DATA" />
                    </LabelText>
                    <BreakableValue>
                        <P size="small">
                            <Truncate>{dexTx.data}</Truncate>
                        </P>
                    </BreakableValue>
                </Row>
            )}

            {(selectedQuote.status === 'APPROVAL_REQ' ||
                (selectedQuote.status === 'CONFIRM' && approvalType === 'ZERO')) && (
                <ButtonWrapper>
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
                        onClick={sendTransaction}
                    >
                        <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                    </Button>
                </ButtonWrapper>
            )}

            {selectedQuote.status === 'CONFIRM' && approvalType !== 'ZERO' && (
                <ButtonWrapper>
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
                        onClick={async () => {
                            // if the last step was change in approval, we have to recompute the swap request
                            if (selectedQuote.approvalType) {
                                selectedQuote.approvalType = undefined;
                                if (!(await confirmTrade(dexTx.from))) {
                                    return;
                                }
                            }
                            setExchangeStep('SEND_TRANSACTION');
                        }}
                    >
                        <Translation id="TR_EXCHANGE_APPROVAL_TO_SWAP_BUTTON" />
                    </Button>
                </ButtonWrapper>
            )}

            {selectedQuote.status === 'ERROR' && (
                <ButtonWrapper>
                    <Button onClick={navigateToExchangeForm}>
                        <Translation id="TR_EXCHANGE_DETAIL_ERROR_BUTTON" />
                    </Button>
                </ButtonWrapper>
            )}
        </Wrapper>
    );
};

export default SendApprovalTransactionComponent;
