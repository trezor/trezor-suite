import { ChangeEvent, useState } from 'react';
import { FieldError } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';
import styled from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { TradingExchangeType, useTradingInfo } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    Button,
    Card,
    CollapsibleBox,
    Column,
    Divider,
    ElevationContext,
    InfoItem,
    Input,
    Row,
    SelectBar,
    Tooltip,
} from '@trezor/components';
import { BottomText } from '@trezor/components/src/components/form/BottomText';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { AccountLabeling, Address, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { FORM_SEND_CRYPTO_CURRENCY_SELECT } from 'src/constants/wallet/trading/form';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { getTradingNetworkDecimals } from 'src/utils/wallet/trading/tradingUtils';

const BreakableValue = styled.span`
    word-break: break-all;
`;

const SLIPPAGE_MIN = '0.01';
const SLIPPAGE_MAX = '50';
const CUSTOM_SLIPPAGE = 'CUSTOM';

const slippageOptions = [
    {
        label: '0.1%',
        value: '0.1',
    },
    {
        label: '0.5%',
        value: '0.5',
    },
    {
        label: '1%',
        value: '1',
    },
    {
        label: '3%',
        value: '3',
    },
    {
        label: <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_CUSTOM" />,
        value: CUSTOM_SLIPPAGE,
    },
];

const formatCryptoAmountAsAmount = (amount: number, baseAmount: number, decimals = 8): string => {
    let digits = 4;
    if (baseAmount < 1) {
        digits = 6;
    }
    if (baseAmount < 0.01) {
        digits = decimals;
    }

    return amount.toFixed(digits);
};

export const TradingOfferExchangeSendSwap = () => {
    const { handleClick, disabled } = useAsyncClickHandler();

    const {
        type,
        device,
        account,
        callInProgress,
        selectedQuote,
        exchangeInfo,
        confirmTrade,
        sendTransaction,
        getValues,
    } = useTradingFormContext<TradingExchangeType>();
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo(type);
    const [slippage, setSlippage] = useState(selectedQuote?.swapSlippage ?? '1');
    const [customSlippage, setCustomSlippage] = useState(slippage);
    const [customSlippageError, setCustomSlippageError] = useState<
        (FieldError & { message: TranslationKey }) | undefined
    >();
    const sendCryptoSelect = getValues(FORM_SEND_CRYPTO_CURRENCY_SELECT);
    const decimals = getTradingNetworkDecimals({
        sendCryptoSelect,
    });

    // only used for custom slippage
    useDebounce(
        () => {
            if (slippage !== CUSTOM_SLIPPAGE) return;

            if (
                selectedQuote &&
                selectedQuote?.dexTx &&
                selectedQuote.receiveAddress &&
                !customSlippageError &&
                customSlippage !== selectedQuote.swapSlippage
            ) {
                confirmTrade({
                    receiveAddress: selectedQuote.receiveAddress,
                    extraField: undefined,
                    trade: {
                        ...selectedQuote,
                        swapSlippage: customSlippage,
                        approvalType: undefined,
                    },
                });
            }
        },
        500,
        [customSlippage, slippage],
    );

    if (!selectedQuote) return null;

    const { exchange, dexTx, receive, send, receiveStringAmount } = selectedQuote;
    if (!exchange || !dexTx || !receive || !send) return null;

    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    const { coinSymbol: sendCoinSymbol, contractAddress: sendContractAddress } =
        cryptoIdToSymbolAndContractAddress(send);
    const sendDisplaySymbol =
        sendCoinSymbol && getDisplaySymbol(sendCoinSymbol, sendContractAddress);
    const { coinSymbol: receiveCoinSymbol, contractAddress: receiveContractAddress } =
        cryptoIdToSymbolAndContractAddress(receive);
    const receiveDisplaySymbol =
        receiveCoinSymbol && getDisplaySymbol(receiveCoinSymbol, receiveContractAddress);

    const translationValues = {
        value: selectedQuote.approvalStringAmount,
        send: sendDisplaySymbol,
        provider: providerName,
    };

    const selectedSlippage =
        slippageOptions.find(o => o.value === slippage)?.value || CUSTOM_SLIPPAGE;

    const changeSlippage = async (value: string) => {
        setSlippage(value);
        if (value !== CUSTOM_SLIPPAGE) {
            setCustomSlippage(value);

            if (!selectedQuote.dexTx || !selectedQuote.receiveAddress) return;

            await confirmTrade({
                receiveAddress: selectedQuote.receiveAddress,
                extraField: undefined,
                trade: {
                    ...selectedQuote,
                    swapSlippage: value,
                    approvalType: undefined,
                },
            });
        }
    };

    const changeCustomSlippage = (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setCustomSlippage(value);
        if (!value) {
            setCustomSlippageError({
                type: 'error',
                message: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_SET',
            });

            return;
        }
        const slippage = new BigNumber(value);
        if (slippage.isNaN() || value.startsWith('.') || value.endsWith('.')) {
            setCustomSlippageError({
                type: 'error',
                message: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_NUMBER',
            });
        } else if (slippage.lt(SLIPPAGE_MIN) || slippage.gt(SLIPPAGE_MAX)) {
            setCustomSlippageError({
                type: 'error',
                message: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_IN_RANGE',
            });
        } else {
            setCustomSlippageError(undefined);
        }
    };

    const confirmAndSend = async () => {
        const result = await sendTransaction();

        analytics.report({
            type: EventType.TradingExchange,
            payload: {
                action: result ? 'continue' : 'cancel',
                step: 'confirm-and-send',
                slippage: customSlippage,
            },
        });
    };

    return (
        <Column gap={spacings.lg} flex="1">
            <InfoItem label={<Translation id="TR_EXCHANGE_SEND_FROM" />}>
                <AccountLabeling account={account} />
            </InfoItem>
            <InfoItem
                label={<Translation id="TR_EXCHANGE_SWAP_SEND_TO" values={translationValues} />}
            >
                <Address value={dexTx.to} />
            </InfoItem>

            <Card
                fillType="default"
                margin={{ vertical: spacings.md }}
                heading={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE" />}
            >
                <ElevationContext baseElevation={0}>
                    <Column gap={spacings.lg}>
                        <InfoItem
                            label={
                                <Tooltip
                                    content={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_INFO" />}
                                    hasIcon
                                >
                                    <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_TOLERANCE" />
                                </Tooltip>
                            }
                            margin={{ bottom: spacings.xxs }}
                        >
                            <Row gap={spacings.sm} margin={{ top: spacings.xxs }}>
                                <SelectBar
                                    selectedOption={selectedSlippage}
                                    options={slippageOptions}
                                    onChange={changeSlippage}
                                    isFullWidth
                                />
                                {slippage === CUSTOM_SLIPPAGE && (
                                    <Input
                                        value={customSlippage}
                                        size="small"
                                        inputState={customSlippageError && 'error'}
                                        name="CustomSlippage"
                                        data-testid="CustomSlippage"
                                        onChange={changeCustomSlippage}
                                        width={100}
                                        align="center"
                                        // eslint-disable-next-line jsx-a11y/no-autofocus
                                        autoFocus
                                    />
                                )}
                            </Row>
                            {customSlippageError?.message ? (
                                <BottomText
                                    inputState={customSlippageError && 'error'}
                                    iconName="warningCircle"
                                >
                                    <Translation id={customSlippageError?.message} />
                                </BottomText>
                            ) : null}
                        </InfoItem>

                        <InfoItem label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_OFFERED" />}>
                            <FormattedCryptoAmount
                                value={receiveStringAmount}
                                symbol={receiveCoinSymbol}
                                contractAddress={receiveContractAddress}
                            />
                        </InfoItem>

                        <InfoItem label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT" />}>
                            {`-${formatCryptoAmountAsAmount(
                                (Number(selectedQuote.swapSlippage) / 100) *
                                    Number(receiveStringAmount),
                                Number(receiveStringAmount),
                                decimals,
                            )} ${receiveDisplaySymbol}`}
                        </InfoItem>

                        <InfoItem label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM" />}>
                            {`${formatCryptoAmountAsAmount(
                                ((100 - Number(selectedQuote.swapSlippage)) / 100) *
                                    Number(receiveStringAmount),
                                Number(receiveStringAmount),
                                decimals,
                            )} ${receiveDisplaySymbol}`}
                        </InfoItem>
                    </Column>
                </ElevationContext>
            </Card>

            <CollapsibleBox heading={<Translation id="TR_EXCHANGE_SWAP_DATA" />}>
                <BreakableValue>{dexTx.data}</BreakableValue>
            </CollapsibleBox>

            <Column>
                <Divider margin={{ top: spacings.xs, bottom: spacings.lg }} />
                <Button
                    isLoading={callInProgress || disabled}
                    isDisabled={!device?.connected || disabled}
                    onClick={() => handleClick(() => confirmAndSend())}
                >
                    <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                </Button>
            </Column>
        </Column>
    );
};
