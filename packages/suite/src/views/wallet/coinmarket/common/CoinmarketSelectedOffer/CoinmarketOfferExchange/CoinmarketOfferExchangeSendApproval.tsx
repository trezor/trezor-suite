import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Translation, AccountLabeling } from 'src/components/suite';
import { Button, Spinner, Radio, variables, Paragraph } from '@trezor/components';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { DexApprovalType, ExchangeTrade } from 'invity-api';
import useTimeoutFn from 'react-use/lib/useTimeoutFn';
import useUnmount from 'react-use/lib/useUnmount';
import invityAPI from 'src/services/suite/invityAPI';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

// add APPROVED means no approval request is necessary
type ExtendedDexApprovalType = DexApprovalType | 'APPROVED';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const LabelText = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

const Value = styled.div`
    padding-top: 6px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
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
    border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    margin: 20px 0;
`;

const Row = styled.div`
    margin: 10px 24px;
`;

const RadioInner = styled.div`
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
    padding: 60px 20px;
    flex-direction: column;
`;

const ErrorWrapper = styled(LoaderWrapper)`
    color: ${({ theme }) => theme.legacy.TYPE_RED};
`;

const REFRESH_SECONDS = 15;
const shouldRefresh = (quote?: ExchangeTrade) => quote?.status === 'APPROVAL_PENDING';

export const CoinmarketOfferExchangeSendApproval = () => {
    const {
        account,
        callInProgress,
        selectedQuote,
        exchangeInfo,
        confirmTrade,
        sendTransaction,
        setExchangeStep,
    } = useCoinmarketFormContext<CoinmarketTradeExchangeType>();
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();
    const selectQuoteHelper = useMemo(() => ({ ...selectedQuote }), [selectedQuote]);
    const [approvalType, setApprovalType] = useState<ExtendedDexApprovalType>(
        selectQuoteHelper?.status === 'CONFIRM' ? 'APPROVED' : 'MINIMAL',
    );

    // watch the trade if transaction in confirmation
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefresh(selectQuoteHelper)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);
    useUnmount(() => {
        cancelRefresh();
    });
    useEffect(() => {
        if (selectQuoteHelper && shouldRefresh(selectQuoteHelper)) {
            const watchTradeAsync = async () => {
                cancelRefresh();
                const response = await invityAPI.watchTrade<'exchange'>(
                    selectQuoteHelper,
                    'exchange',
                    refreshCount,
                );

                if (response.status && response.status !== selectQuoteHelper.status) {
                    selectQuoteHelper.status = response.status;
                    selectQuoteHelper.error = response.error;
                    selectQuoteHelper.approvalType = undefined;
                    if (selectQuoteHelper.dexTx) {
                        confirmTrade(selectQuoteHelper.dexTx.from, undefined, selectQuoteHelper);
                    }
                }
                resetRefresh();
            };

            watchTradeAsync();
        }
    }, [cancelRefresh, confirmTrade, refreshCount, resetRefresh, selectQuoteHelper]);

    const { navigateToExchangeForm } = useCoinmarketNavigation(account);

    if (!selectQuoteHelper) return null;

    const { exchange, dexTx } = selectQuoteHelper;
    if (!exchange || !dexTx) return null;

    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectQuoteHelper.exchange;

    const isFullApproval = !(Number(selectQuoteHelper.preapprovedStringAmount) > 0);
    const isToken = selectQuoteHelper.send !== account.symbol.toUpperCase();

    if (!selectQuoteHelper.send) return null;

    if (isFullApproval && approvalType === 'ZERO') {
        setApprovalType('MINIMAL');
    }

    const translationValues = {
        value: selectQuoteHelper.approvalStringAmount,
        send: cryptoIdToCoinSymbol(selectQuoteHelper.send),
        provider: providerName,
    };

    const selectApprovalValue = (type: ExtendedDexApprovalType) => {
        setApprovalType(type);
        if (type !== 'APPROVED') {
            selectQuoteHelper.approvalType = type;
            confirmTrade(dexTx.from, undefined, selectQuoteHelper);
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

            {selectQuoteHelper.approvalSendTxHash && (
                <Row>
                    <LabelText>
                        <Translation id="TR_EXCHANGE_APPROVAL_TXID" />
                    </LabelText>
                    <Value>
                        <Address>{selectQuoteHelper.approvalSendTxHash}</Address>
                    </Value>
                </Row>
            )}
            {selectQuoteHelper.status === 'APPROVAL_PENDING' && (
                <LoaderWrapper>
                    <Spinner />
                    <Title>
                        <Translation id="TR_EXCHANGE_APPROVAL_CONFIRMING" />
                    </Title>
                </LoaderWrapper>
            )}
            {selectQuoteHelper.status === 'ERROR' && (
                <ErrorWrapper>
                    <Title>
                        <Translation id="TR_EXCHANGE_APPROVAL_FAILED" />
                    </Title>
                </ErrorWrapper>
            )}

            {(selectQuoteHelper.status === 'APPROVAL_REQ' ||
                selectQuoteHelper.status === 'CONFIRM') && (
                <Row>
                    <LabelText>
                        <Translation id="TR_EXCHANGE_APPROVAL_VALUE" />
                    </LabelText>
                    {selectQuoteHelper.status === 'APPROVAL_REQ' && (
                        <>
                            <Value>
                                <Radio
                                    isChecked={approvalType === 'MINIMAL'}
                                    onClick={() => selectApprovalValue('MINIMAL')}
                                >
                                    <RadioInner>
                                        <>
                                            <Paragraph>
                                                <Translation
                                                    id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL"
                                                    values={translationValues}
                                                />
                                            </Paragraph>
                                            <LabelText>
                                                <Translation
                                                    id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO"
                                                    values={translationValues}
                                                />
                                            </LabelText>
                                        </>
                                    </RadioInner>
                                </Radio>
                            </Value>
                            <Value>
                                <Radio
                                    isChecked={approvalType === 'INFINITE'}
                                    onClick={() => selectApprovalValue('INFINITE')}
                                >
                                    <RadioInner>
                                        <Paragraph>
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE"
                                                values={translationValues}
                                            />
                                        </Paragraph>
                                        <LabelText>
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO"
                                                values={translationValues}
                                            />
                                        </LabelText>
                                    </RadioInner>
                                </Radio>
                            </Value>
                        </>
                    )}
                    {selectQuoteHelper.status !== 'APPROVAL_REQ' && (
                        <Value>
                            <Radio
                                isChecked={approvalType === 'APPROVED'}
                                onClick={() => selectApprovalValue('APPROVED')}
                            >
                                <RadioInner>
                                    <Paragraph>
                                        {!isToken && (
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_NOT_REQUIRED"
                                                values={translationValues}
                                            />
                                        )}
                                        {isToken && selectQuoteHelper.approvalSendTxHash && (
                                            <Translation id="TR_EXCHANGE_APPROVAL_SUCCESS" />
                                        )}
                                        {isToken && !selectQuoteHelper.approvalSendTxHash && (
                                            <Translation id="TR_EXCHANGE_APPROVAL_PREAPPROVED" />
                                        )}
                                    </Paragraph>
                                    <LabelText>
                                        <Translation id="TR_EXCHANGE_APPROVAL_PROCEED" />
                                    </LabelText>
                                </RadioInner>
                            </Radio>
                        </Value>
                    )}
                    {isToken && !isFullApproval && (
                        <Value>
                            <Radio
                                isChecked={approvalType === 'ZERO'}
                                onClick={() => selectApprovalValue('ZERO')}
                            >
                                <RadioInner>
                                    <Paragraph>
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_ZERO"
                                            values={translationValues}
                                        />
                                    </Paragraph>
                                    <LabelText>
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_ZERO_INFO"
                                            values={translationValues}
                                        />
                                    </LabelText>
                                </RadioInner>
                            </Radio>
                        </Value>
                    )}
                </Row>
            )}

            {dexTx.data && (selectQuoteHelper.status !== 'CONFIRM' || approvalType === 'ZERO') && (
                <Row>
                    <LabelText>
                        <Translation id="TR_EXCHANGE_APPROVAL_DATA" />
                    </LabelText>
                    <BreakableValue>
                        <Paragraph typographyStyle="hint">{dexTx.data}</Paragraph>
                    </BreakableValue>
                </Row>
            )}

            {(selectQuoteHelper.status === 'APPROVAL_REQ' ||
                (selectQuoteHelper.status === 'CONFIRM' && approvalType === 'ZERO')) && (
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

            {selectQuoteHelper.status === 'CONFIRM' && approvalType !== 'ZERO' && (
                <ButtonWrapper>
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
                        onClick={async () => {
                            // if the last step was change in approval, we have to recompute the swap request
                            if (selectQuoteHelper.approvalType) {
                                selectQuoteHelper.approvalType = undefined;

                                const confirmedTrade = await confirmTrade(
                                    dexTx.from,
                                    undefined,
                                    selectQuoteHelper,
                                );

                                if (!confirmedTrade) {
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

            {selectQuoteHelper.status === 'ERROR' && (
                <ButtonWrapper>
                    <Button onClick={navigateToExchangeForm}>
                        <Translation id="TR_EXCHANGE_DETAIL_ERROR_BUTTON" />
                    </Button>
                </ButtonWrapper>
            )}
        </Wrapper>
    );
};
