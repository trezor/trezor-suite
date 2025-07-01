import { useEffect, useState } from 'react';

import { DexApprovalType } from 'invity-api';
import styled from 'styled-components';

import {
    TradingExchangeType,
    parseCryptoId,
    tradingExchangeActions,
    useTradingInfo,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    Banner,
    Card,
    CollapsibleBox,
    Column,
    InfoItem,
    Modal,
    Paragraph,
    Radio,
    Row,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { TxAddress } from 'src/components/suite/copy/TxAddress';
import { AccountLabeling } from 'src/components/suite/labeling';
import { useDispatch } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingExchangeApprovalType } from 'src/types/trading/tradingForm';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

const BreakableValue = styled.span`
    word-break: break-all;
`;

type ApproveModalProps = {
    setApprovalType: (approvalType: TradingExchangeApprovalType) => void;
    onCancel: () => void;
};

export const ApproveModal = ({
    setApprovalType: setParentApprovalType,
    onCancel,
}: ApproveModalProps) => {
    const dispatch = useDispatch();
    const {
        form: {
            state: { isFormLoading },
        },
        device,
        account,
        selectedQuote,
        exchangeInfo,
        confirmTrade,
        sendTransaction,
        preselectedQuote,
    } = useTradingFormContext<TradingExchangeType>();

    const { cryptoIdToSymbolAndContractAddress, cryptoIdToCoinSymbol } = useTradingInfo();

    const [approvalType, setApprovalType] = useState<DexApprovalType>('MINIMAL');
    const [isConfirmButtonLoading, setIsConfirmButtonLoading] = useState<boolean>(false);

    useEffect(() => {
        if (selectedQuote?.status !== 'APPROVAL_REQ') {
            onCancel();
        }
    }, [selectedQuote?.status, onCancel]);

    if (!selectedQuote) return null;

    const { exchange, dexTx } = selectedQuote;
    if (!exchange || !dexTx) return null;

    const quoteExchange = preselectedQuote?.exchange ?? exchange;

    const providerName = exchangeInfo?.providerInfos[quoteExchange]?.companyName || quoteExchange;

    const isFullApproval = !(Number(selectedQuote.preapprovedStringAmount) > 0);

    if (!selectedQuote.send) return null;

    const isToken = parseCryptoId(selectedQuote.send)?.contractAddress !== undefined;

    const translationValues = {
        value: selectedQuote.approvalStringAmount,
        send: cryptoIdToCoinSymbol(selectedQuote.send),
        provider: providerName,
    };

    const preapprovedTranslationValues = {
        value: selectedQuote.preapprovedStringAmount,
        send: cryptoIdToCoinSymbol(selectedQuote.send),
        provider: providerName,
    };

    const selectApprovalValue = async (type: DexApprovalType) => {
        if (!selectedQuote.receiveAddress) {
            return;
        }

        setApprovalType(type);

        switch (type) {
            case 'MINIMAL':
            case 'INFINITE':
                setParentApprovalType('APPROVE');
                break;
            case 'ZERO':
                setParentApprovalType('REVOKE');
                break;
        }

        const updatedSelectedQuote = {
            ...selectedQuote,
            approvalType: type,
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(updatedSelectedQuote));

        await confirmTrade({
            receiveAddress: selectedQuote.receiveAddress,
            extraField: undefined,
            trade: updatedSelectedQuote,
            approvalFlow: true,
        });
    };

    const confirmAndSend = async () => {
        setIsConfirmButtonLoading(true);
        await sendTransaction();
        setIsConfirmButtonLoading(false);
        onCancel();
    };

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(selectedQuote.send);
    const displaySymbol = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);

    return (
        <Modal
            onCancel={onCancel}
            variant="primary"
            size="small"
            heading={
                <Row gap={spacings.sm}>
                    <TradingCoinLogo cryptoId={selectedQuote.send} size={24} />
                    <Translation
                        id="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING"
                        values={{ displaySymbol }}
                    />
                </Row>
            }
            bottomContent={
                <>
                    {selectedQuote.status === 'APPROVAL_REQ' && (
                        <Modal.Button
                            size="medium"
                            isLoading={isFormLoading || isConfirmButtonLoading}
                            isDisabled={!device?.connected}
                            onClick={confirmAndSend}
                        >
                            <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                        </Modal.Button>
                    )}

                    <Modal.Button size="medium" variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.sm}>
                <Card>
                    <Column gap={spacings.sm}>
                        <InfoItem label={<Translation id="TR_EXCHANGE_SEND_FROM" />}>
                            <AccountLabeling
                                account={account}
                                showAccountTypeBadge={true}
                                accountTypeBadgeSize="small"
                            />
                        </InfoItem>
                        <InfoItem
                            label={
                                <Translation
                                    id="TR_EXCHANGE_APPROVAL_SEND_TO"
                                    values={translationValues}
                                />
                            }
                        >
                            <TxAddress txAddress={dexTx.to} shouldChunk />
                        </InfoItem>
                    </Column>
                </Card>

                {selectedQuote.status === 'APPROVAL_REQ' ? (
                    <>
                        <Card
                            label={
                                <Text typographyStyle="hint">
                                    <Translation id="TR_EXCHANGE_APPROVAL_VALUE" />
                                </Text>
                            }
                        >
                            <Column gap={spacings.xl} alignItems="flex-start">
                                <>
                                    <Radio
                                        isChecked={approvalType === 'MINIMAL'}
                                        onClick={() => selectApprovalValue('MINIMAL')}
                                        verticalAlignment="center"
                                        isDisabled={isFormLoading}
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
                                        isDisabled={isFormLoading}
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

                                    {isToken && !isFullApproval && (
                                        <Radio
                                            isChecked={approvalType === 'ZERO'}
                                            onClick={() => selectApprovalValue('ZERO')}
                                            verticalAlignment="center"
                                            isDisabled={isFormLoading}
                                        >
                                            <Column alignItems="flex-start">
                                                <Text typographyStyle="highlight">
                                                    <Translation
                                                        id="TR_EXCHANGE_APPROVAL_VALUE_ZERO"
                                                        values={preapprovedTranslationValues}
                                                    />
                                                </Text>
                                                <Paragraph typographyStyle="hint">
                                                    <Translation
                                                        id="TR_EXCHANGE_APPROVAL_VALUE_ZERO_INFO"
                                                        values={preapprovedTranslationValues}
                                                    />
                                                </Paragraph>
                                            </Column>
                                        </Radio>
                                    )}
                                </>
                            </Column>
                        </Card>

                        {dexTx.data && (
                            <CollapsibleBox
                                heading={<Translation id="TR_EXCHANGE_APPROVAL_DATA" />}
                            >
                                <BreakableValue>{dexTx.data}</BreakableValue>
                            </CollapsibleBox>
                        )}
                    </>
                ) : (
                    <Banner variant="destructive">
                        <Translation id="TR_EXCHANGE_APPROVAL_ERROR" />
                    </Banner>
                )}
            </Column>
        </Modal>
    );
};
