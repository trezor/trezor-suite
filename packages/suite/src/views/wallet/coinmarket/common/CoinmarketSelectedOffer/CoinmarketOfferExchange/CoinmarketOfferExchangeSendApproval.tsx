import { useState } from 'react';

import styled from 'styled-components';
import { DexApprovalType } from 'invity-api';

import {
    Button,
    Banner,
    Spinner,
    Radio,
    Paragraph,
    Column,
    Divider,
    InfoItem,
    Text,
    Card,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation, AccountLabeling } from 'src/components/suite';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { useCoinmarketExchangeWatchSendApproval } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeWatchSendApproval';
import { useDispatch } from 'src/hooks/suite';
import { saveSelectedQuote } from 'src/actions/wallet/coinmarketExchangeActions';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';

// add APPROVED means no approval request is necessary
type ExtendedDexApprovalType = DexApprovalType | 'APPROVED';

const BreakableValue = styled.span`
    word-break: break-all;
`;

export const CoinmarketOfferExchangeSendApproval = () => {
    const dispatch = useDispatch();
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

    if (!selectedQuote.send) return null;

    const isToken = parseCryptoId(selectedQuote.send)?.contractAddress !== undefined;

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
            const updatedSelectedQuote = {
                ...selectedQuote,
                approvalType: type,
            };

            dispatch(saveSelectedQuote(updatedSelectedQuote));

            await confirmTrade(dexTx.from, undefined, updatedSelectedQuote);
        }
    };

    // if the last step was change in approval, we have to recompute the swap request
    const proceedToSwap = async () => {
        if (selectedQuote.approvalType) {
            const updatedSelectedQuote = {
                ...selectedQuote,
                approvalType: undefined,
            };
            dispatch(
                saveSelectedQuote({
                    ...selectedQuote,
                    approvalType: undefined,
                }),
            );

            const confirmedTrade = await confirmTrade(dexTx.from, undefined, updatedSelectedQuote);

            if (!confirmedTrade) {
                return;
            }
        }

        setExchangeStep('SEND_TRANSACTION');
    };

    return (
        <Column gap={spacings.lg} flex="1">
            <InfoItem label={<Translation id="TR_EXCHANGE_SEND_FROM" />}>
                <AccountLabeling account={account} />
            </InfoItem>
            <InfoItem
                label={
                    <Translation
                        id={
                            approvalType === 'APPROVED'
                                ? 'TR_EXCHANGE_SWAP_SEND_TO'
                                : 'TR_EXCHANGE_APPROVAL_SEND_TO'
                        }
                        values={translationValues}
                    />
                }
            >
                {dexTx.to}
            </InfoItem>
            {selectedQuote.approvalSendTxHash && (
                <InfoItem label={<Translation id="TR_EXCHANGE_APPROVAL_TXID" />}>
                    {selectedQuote.approvalSendTxHash}
                </InfoItem>
            )}
            {selectedQuote.status === 'APPROVAL_PENDING' && (
                <Column
                    alignItems="center"
                    justifyContent="center"
                    margin={{ top: spacings.xxxxl, bottom: spacings.md }}
                >
                    <Spinner />
                    <Paragraph typographyStyle="highlight" margin={{ top: spacings.lg }}>
                        <Translation id="TR_EXCHANGE_APPROVAL_CONFIRMING" />
                    </Paragraph>
                </Column>
            )}
            {selectedQuote.status === 'ERROR' && (
                <Banner variant="destructive" icon margin={{ top: spacings.xl }}>
                    <Translation id="TR_EXCHANGE_APPROVAL_FAILED" />
                </Banner>
            )}

            {(selectedQuote.status === 'APPROVAL_REQ' || selectedQuote.status === 'CONFIRM') && (
                <Card
                    label={
                        <Text typographyStyle="hint">
                            <Translation id="TR_EXCHANGE_APPROVAL_VALUE" />
                        </Text>
                    }
                    margin={{ top: spacings.md }}
                >
                    <Column gap={spacings.xl} alignItems="flex-start">
                        {selectedQuote.status === 'APPROVAL_REQ' && (
                            <>
                                <Radio
                                    isChecked={approvalType === 'MINIMAL'}
                                    onClick={() => selectApprovalValue('MINIMAL')}
                                    verticalAlignment="center"
                                >
                                    <Column alignItems="flex-start">
                                        <Text typographyStyle="highlight">
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL"
                                                values={translationValues}
                                            />
                                        </Text>
                                        <Paragraph typographyStyle="hint">
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO"
                                                values={translationValues}
                                            />
                                        </Paragraph>
                                    </Column>
                                </Radio>
                                <Radio
                                    isChecked={approvalType === 'INFINITE'}
                                    onClick={() => selectApprovalValue('INFINITE')}
                                    verticalAlignment="center"
                                >
                                    <Column alignItems="flex-start">
                                        <Text typographyStyle="highlight">
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE"
                                                values={translationValues}
                                            />
                                        </Text>
                                        <Paragraph typographyStyle="hint">
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO"
                                                values={translationValues}
                                            />
                                        </Paragraph>
                                    </Column>
                                </Radio>
                            </>
                        )}
                        {selectedQuote.status !== 'APPROVAL_REQ' && (
                            <Radio
                                isChecked={approvalType === 'APPROVED'}
                                onClick={() => selectApprovalValue('APPROVED')}
                                verticalAlignment="center"
                            >
                                <Column alignItems="flex-start">
                                    <Text typographyStyle="highlight">
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
                                    </Text>
                                    <Paragraph typographyStyle="hint">
                                        <Translation id="TR_EXCHANGE_APPROVAL_PROCEED" />
                                    </Paragraph>
                                </Column>
                            </Radio>
                        )}
                        {isToken && !isFullApproval && (
                            <Radio
                                isChecked={approvalType === 'ZERO'}
                                onClick={() => selectApprovalValue('ZERO')}
                                verticalAlignment="center"
                            >
                                <Column alignItems="flex-start">
                                    <Text typographyStyle="highlight">
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_ZERO"
                                            values={translationValues}
                                        />
                                    </Text>
                                    <Paragraph typographyStyle="hint">
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_ZERO_INFO"
                                            values={translationValues}
                                        />
                                    </Paragraph>
                                </Column>
                            </Radio>
                        )}
                    </Column>
                </Card>
            )}

            {dexTx.data && (selectedQuote.status !== 'CONFIRM' || approvalType === 'ZERO') && (
                <InfoItem label={<Translation id="TR_EXCHANGE_APPROVAL_DATA" />}>
                    <BreakableValue>{dexTx.data}</BreakableValue>
                </InfoItem>
            )}

            <Column alignItems="center">
                <Divider margin={{ top: spacings.xxs, bottom: spacings.lg }} />
                {(selectedQuote.status === 'APPROVAL_REQ' ||
                    (selectedQuote.status === 'CONFIRM' && approvalType === 'ZERO')) && (
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
                        onClick={sendTransaction}
                    >
                        <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                    </Button>
                )}

                {selectedQuote.status === 'CONFIRM' && approvalType !== 'ZERO' && (
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
                        onClick={proceedToSwap}
                    >
                        <Translation id="TR_EXCHANGE_APPROVAL_TO_SWAP_BUTTON" />
                    </Button>
                )}

                {selectedQuote.status === 'ERROR' && (
                    <Button onClick={navigateToExchangeForm}>
                        <Translation id="TR_EXCHANGE_DETAIL_ERROR_BUTTON" />
                    </Button>
                )}
            </Column>
        </Column>
    );
};
