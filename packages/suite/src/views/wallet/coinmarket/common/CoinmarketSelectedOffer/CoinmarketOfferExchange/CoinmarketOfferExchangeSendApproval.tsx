import { useState } from 'react';
import styled from 'styled-components';
import { Translation, AccountLabeling } from 'src/components/suite';
import { Button, Spinner, Radio, variables, Paragraph } from '@trezor/components';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { DexApprovalType } from 'invity-api';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { useCoinmarketExchangeWatchSendApproval } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeWatchSendApproval';

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
    const [approvalType, setApprovalType] = useState<ExtendedDexApprovalType>(
        selectedQuote?.status === 'CONFIRM' ? 'APPROVED' : 'MINIMAL',
    );

    const { navigateToExchangeForm } = useCoinmarketNavigation(account);

    useCoinmarketExchangeWatchSendApproval({
        selectedQuote,
        confirmTrade,
    });

    if (!selectedQuote) return null;

    const { exchange, dexTx } = selectedQuote;
    if (!exchange || !dexTx) return null;

    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    const isFullApproval = !(Number(selectedQuote.preapprovedStringAmount) > 0);
    const isToken = selectedQuote.send !== account.symbol.toUpperCase();

    if (!selectedQuote.send) return null;

    if (isFullApproval && approvalType === 'ZERO') {
        setApprovalType('MINIMAL');
    }

    const translationValues = {
        value: selectedQuote.approvalStringAmount,
        send: cryptoIdToCoinSymbol(selectedQuote.send),
        provider: providerName,
    };

    const selectApprovalValue = async (type: ExtendedDexApprovalType) => {
        setApprovalType(type);
        if (type !== 'APPROVED') {
            await confirmTrade(dexTx.from, undefined, {
                ...selectedQuote,
                approvalType: type,
            });
        }
    };

    // if the last step was change in approval, we have to recompute the swap request
    const proceedToSwap = async () => {
        if (selectedQuote.approvalType) {
            const confirmedTrade = await confirmTrade(dexTx.from, undefined, {
                ...selectedQuote,
                approvalType: undefined,
            });

            if (!confirmedTrade) {
                return;
            }
        }

        setExchangeStep('SEND_TRANSACTION');
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
                    <Spinner />
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
                    {selectedQuote.status !== 'APPROVAL_REQ' && (
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
                                        {isToken && selectedQuote.approvalSendTxHash && (
                                            <Translation id="TR_EXCHANGE_APPROVAL_SUCCESS" />
                                        )}
                                        {isToken && !selectedQuote.approvalSendTxHash && (
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

            {dexTx.data && (selectedQuote.status !== 'CONFIRM' || approvalType === 'ZERO') && (
                <Row>
                    <LabelText>
                        <Translation id="TR_EXCHANGE_APPROVAL_DATA" />
                    </LabelText>
                    <BreakableValue>
                        <Paragraph typographyStyle="hint">{dexTx.data}</Paragraph>
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
                        onClick={proceedToSwap}
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
