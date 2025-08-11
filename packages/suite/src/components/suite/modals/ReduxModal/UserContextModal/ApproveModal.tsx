import { useState } from 'react';

import { DexApprovalType, ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import {
    TradingExchangeType,
    invityAPI,
    tradingExchangeActions,
    useTradingInfo,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    Badge,
    Box,
    CollapsibleBox,
    Column,
    Modal,
    Paragraph,
    RadioCard,
    Row,
    Text,
} from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders, spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { AccountLabeling } from 'src/components/suite/labeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';
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
    onCancel: (isSubmitting?: boolean) => void;
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
        fetchFeesAndCompose,
    } = context;

    const isDebug = useSelector(selectIsDebugModeActive);

    const { cryptoIdToSymbolAndContractAddress, cryptoIdToCoinSymbol } = useTradingInfo();

    const [approvalType, setApprovalType] = useState<DexApprovalType>('MINIMAL');
    const [isConfirmButtonLoading, setIsConfirmButtonLoading] = useState<boolean>(false);

    if (!selectedQuote) return null;

    const { exchange, dexTx } = selectedQuote;
    if (!exchange || !dexTx) return null;

    const quoteExchange = preselectedQuote?.exchange ?? exchange;

    const providerName = exchangeInfo?.providerInfos[quoteExchange]?.companyName || quoteExchange;

    if (!selectedQuote.send) return null;

    const translationValues = {
        value: selectedQuote.approvalStringAmount,
        send: cryptoIdToCoinSymbol(selectedQuote.send),
        provider: providerName,
    };

    const selectApprovalValue = async (type: DexApprovalType) => {
        if (!selectedQuote.receiveAddress || approvalType === type) {
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

        const trade = await confirmApproval({
            trade: updatedSelectedQuote,
            receiveAddress: selectedQuote.receiveAddress,
        });

        setValue('ethereumDataHex', trade?.dexTx?.data);

        await fetchFeesAndCompose();

        setIsConfirmButtonLoading(false);
    };

    const confirmAndSend = async () => {
        setIsConfirmButtonLoading(true);
        await sendTransaction();
        setIsConfirmButtonLoading(false);
        onCancel(true);
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
            onCancel={() => onCancel()}
            variant="primary"
            size="small"
            heading={
                <Translation
                    id="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING"
                    values={{ displaySymbol }}
                />
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
                            <Translation id="TR_CONTINUE" />
                        </Modal.Button>
                    )}

                    <Modal.Button size="medium" variant="tertiary" onClick={() => onCancel()}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            description={
                <Row margin={{ top: spacings.xs }} gap={spacings.xxs}>
                    <CoinLogo size={20} symbol={account.symbol} />
                    <AccountLabeling
                        account={account}
                        showAccountTypeBadge
                        accountTypeBadgeSize="small"
                    />
                </Row>
            }
        >
            <Column gap={spacings.sm}>
                <Box
                    padding={spacings.sm}
                    borderWidth={borders.widths.large}
                    borderRadius={borders.radii.sm}
                >
                    <Column gap={spacings.sm}>
                        <Text>
                            <Translation id="TR_EXCHANGE_APPROVAL_PROVIDER" />
                        </Text>
                        <Row gap={spacings.xs}>
                            {provider?.logo && (
                                <Icon src={invityAPI.getProviderLogoUrl(provider.logo)} alt="" />
                            )}
                            <Column>
                                {provider?.companyName && <Text>{provider.companyName}</Text>}
                                <Text typographyStyle="hint" variant="tertiary">
                                    {contractAddress}
                                </Text>
                            </Column>
                        </Row>
                    </Column>
                </Box>

                <Box
                    borderWidth={borders.widths.large}
                    padding={spacings.sm}
                    borderRadius={borders.radii.sm}
                >
                    <Column gap={spacings.sm}>
                        <Text>
                            <Translation id="TR_EXCHANGE_APPROVAL_SET_LIMIT" />
                        </Text>
                        <RadioCard
                            isActive={approvalType === 'INFINITE'}
                            isDisabled={isConfirmButtonLoading}
                            onClick={() => selectApprovalValue('INFINITE')}
                        >
                            <Row>
                                <TradingCoinLogo
                                    cryptoId={selectedQuote.send}
                                    size={20}
                                    margin={{ right: spacings.xxs }}
                                />
                                <Text>
                                    <Translation id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE" />
                                </Text>
                            </Row>
                            <Paragraph
                                margin={{ top: spacings.xxs }}
                                typographyStyle="hint"
                                variant="tertiary"
                            >
                                <Translation
                                    id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO"
                                    values={translationValues}
                                />
                            </Paragraph>
                        </RadioCard>
                        <RadioCard
                            isActive={approvalType === 'MINIMAL'}
                            isDisabled={isConfirmButtonLoading}
                            onClick={() => selectApprovalValue('MINIMAL')}
                        >
                            <Row>
                                <TradingCoinLogo
                                    cryptoId={selectedQuote.send}
                                    size={20}
                                    margin={{ right: spacings.xxs }}
                                />
                                <Text>
                                    <Translation
                                        id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL"
                                        values={translationValues}
                                    />
                                </Text>
                            </Row>
                            <Paragraph
                                margin={{ top: spacings.xxs }}
                                typographyStyle="hint"
                                variant="tertiary"
                            >
                                <Translation
                                    id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO"
                                    values={translationValues}
                                />
                            </Paragraph>
                        </RadioCard>
                        {isDebug && dexTx.data ? (
                            <CollapsibleBox
                                heading={
                                    <Row gap={spacings.xs}>
                                        <Translation id="TR_EXCHANGE_APPROVAL_DATA" />
                                        <Badge variant="warning" size="small">
                                            <Translation id="TR_DEBUG_ONLY" />
                                        </Badge>
                                    </Row>
                                }
                            >
                                <BreakableValue>{dexTx.data}</BreakableValue>
                            </CollapsibleBox>
                        ) : null}
                    </Column>
                </Box>

                <Box
                    padding={spacings.sm}
                    borderWidth={borders.widths.large}
                    borderRadius={borders.radii.sm}
                >
                    <Fees
                        label="TR_TX_FEE"
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
                </Box>
            </Column>
        </Modal>
    );
};
