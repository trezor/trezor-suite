import { useEffect, useState } from 'react';

import { DexApprovalType, ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import {
    TradingExchangeType,
    invityAPI,
    parseCryptoId,
    tradingExchangeActions,
    useTradingInfo,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    Badge,
    Card,
    CollapsibleBox,
    Column,
    Divider,
    Modal,
    Paragraph,
    Radio,
    Row,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { AccountLabeling } from 'src/components/suite/labeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingExchangeApprovalType } from 'src/types/trading/tradingForm';
import { getProvidersInfoProps } from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

const BreakableValue = styled.span`
    word-break: break-all;
`;

const Icon = styled.img`
    flex: none;
    width: 24px;
    height: 24px;
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
    const context = useTradingFormContext<TradingExchangeType>();
    const {
        form: {
            state: { isFormLoading },
        },
        device,
        account,
        selectedQuote,
        exchangeInfo,
        confirmApproval,
        sendTransaction,
        preselectedQuote,
        control,
        feeInfo,
        composedLevels,
        formState: { errors, isDirty },
        register,
        setValue,
        getValues,
        changeFeeLevel,
        trigger,
    } = context;

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

        setIsConfirmButtonLoading(true);
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

        const updatedSelectedQuote: ExchangeTrade = {
            ...selectedQuote,
            approvalType: type,
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(updatedSelectedQuote));

        await confirmApproval({
            trade: updatedSelectedQuote,
            receiveAddress: selectedQuote.receiveAddress,
        });
        setIsConfirmButtonLoading(false);
    };

    const confirmAndSend = async () => {
        setIsConfirmButtonLoading(true);
        await sendTransaction();
        setIsConfirmButtonLoading(false);
    };

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(selectedQuote.send);
    const displaySymbol = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);

    const providers = getProvidersInfoProps(context);
    const provider =
        selectedQuote && selectedQuote.exchange && providers
            ? providers[selectedQuote.exchange]
            : undefined;

    return (
        <Modal
            onCancel={onCancel}
            variant="primary"
            size="small"
            heading={<Translation id="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING" />}
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
                    <Row gap={spacings.sm}>
                        <TradingCoinLogo cryptoId={selectedQuote.send} size={24} />
                        <Column>
                            <Translation
                                id="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN"
                                values={{ displaySymbol }}
                            />
                            <Paragraph typographyStyle="label" variant="default" align="start">
                                <AccountLabeling
                                    account={account}
                                    showAccountTypeBadge={true}
                                    accountTypeBadgeSize="small"
                                />
                            </Paragraph>
                        </Column>
                    </Row>

                    <Divider />

                    <Row gap={spacings.sm}>
                        {provider?.logo && (
                            <Icon src={invityAPI.getProviderLogoUrl(provider.logo)} alt="" />
                        )}

                        {provider?.companyName}
                    </Row>
                </Card>

                <CollapsibleBox
                    heading={
                        <Row gap={spacings.sm}>
                            <Translation id="TR_EXCHANGE_APPROVAL_LIMIT" />
                            {approvalType === 'MINIMAL' && (
                                <Badge variant="primary">
                                    <Translation id="TR_EXCHANGE_APPROVAL_LIMIT_MINIMAL" />
                                </Badge>
                            )}
                            {approvalType === 'INFINITE' && (
                                <Badge variant="warning">
                                    <Translation id="TR_EXCHANGE_APPROVAL_LIMIT_INFINITE" />
                                </Badge>
                            )}
                        </Row>
                    }
                >
                    <Column gap={spacings.md}>
                        <Card>
                            <Radio
                                isChecked={approvalType === 'MINIMAL'}
                                onClick={() => selectApprovalValue('MINIMAL')}
                                verticalAlignment="center"
                                isDisabled={isFormLoading || isConfirmButtonLoading}
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
                        </Card>
                        <Card>
                            <Radio
                                isChecked={approvalType === 'INFINITE'}
                                onClick={() => selectApprovalValue('INFINITE')}
                                verticalAlignment="center"
                                isDisabled={isFormLoading || isConfirmButtonLoading}
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
                        </Card>

                        {isToken && !isFullApproval && (
                            <Card>
                                <Radio
                                    isChecked={approvalType === 'ZERO'}
                                    onClick={() => selectApprovalValue('ZERO')}
                                    verticalAlignment="center"
                                    isDisabled={isFormLoading || isConfirmButtonLoading}
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
                            </Card>
                        )}

                        {dexTx.data && (
                            <CollapsibleBox
                                heading={<Translation id="TR_EXCHANGE_APPROVAL_DATA" />}
                            >
                                <BreakableValue>{dexTx.data}</BreakableValue>
                            </CollapsibleBox>
                        )}
                    </Column>
                </CollapsibleBox>

                <Divider margin={{ top: spacings.xxs, bottom: spacings.xxs }} />

                <Fees
                    control={control}
                    feeInfo={feeInfo}
                    account={account}
                    composedLevels={composedLevels}
                    errors={errors}
                    isDirty={isDirty}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    changeFeeLevel={changeFeeLevel}
                    trigger={trigger}
                />
            </Column>
        </Modal>
    );
};
