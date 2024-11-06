import { useState, ChangeEvent } from 'react';
import { FieldError } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';
import styled, { useTheme } from 'styled-components';

import {
    Button,
    Icon,
    Input,
    InfoRow,
    Column,
    Card,
    Row,
    Divider,
    SelectBar,
    Tooltip,
    ElevationContext,
    getInputStateTextColor,
} from '@trezor/components';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { BottomText } from '@trezor/components/src/components/form/BottomText';
import { TranslationKey } from '@suite-common/intl-types';
import { spacings } from '@trezor/theme';

import { Translation, AccountLabeling, FormattedCryptoAmount } from 'src/components/suite';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { getCoinmarketNetworkDecimals } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { FORM_SEND_CRYPTO_CURRENCY_SELECT } from 'src/constants/wallet/coinmarket/form';

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

export const CoinmarketOfferExchangeSendSwap = () => {
    const theme = useTheme();
    const {
        account,
        callInProgress,
        selectedQuote,
        exchangeInfo,
        confirmTrade,
        sendTransaction,
        getValues,
    } = useCoinmarketFormContext<CoinmarketTradeExchangeType>();
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();
    const [slippage, setSlippage] = useState(selectedQuote?.swapSlippage ?? '1');
    const [customSlippage, setCustomSlippage] = useState(slippage);
    const [customSlippageError, setCustomSlippageError] = useState<
        (FieldError & { message: TranslationKey }) | undefined
    >();
    const sendCryptoSelect = getValues(FORM_SEND_CRYPTO_CURRENCY_SELECT);
    const decimals = getCoinmarketNetworkDecimals({
        sendCryptoSelect,
    });

    // only used for custom slippage
    useDebounce(
        () => {
            if (slippage !== CUSTOM_SLIPPAGE) return;

            if (
                selectedQuote &&
                selectedQuote?.dexTx &&
                !customSlippageError &&
                customSlippage !== selectedQuote.swapSlippage
            ) {
                confirmTrade(selectedQuote.dexTx.from, undefined, {
                    ...selectedQuote,
                    swapSlippage: customSlippage,
                    approvalType: undefined,
                });
            }
        },
        500,
        [customSlippage, slippage],
    );

    if (!selectedQuote?.send) return null;

    const { exchange, dexTx, receive, receiveStringAmount } = selectedQuote;
    if (!exchange || !dexTx || !receive) return null;

    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    const translationValues = {
        value: selectedQuote.approvalStringAmount,
        send: cryptoIdToCoinSymbol(selectedQuote.send),
        provider: providerName,
    };

    const selectedSlippage =
        slippageOptions.find(o => o.value === slippage)?.value || CUSTOM_SLIPPAGE;

    const changeSlippage = async (value: string) => {
        setSlippage(value);
        if (value !== CUSTOM_SLIPPAGE) {
            setCustomSlippage(value);

            if (!selectedQuote.dexTx) return;

            await confirmTrade(selectedQuote.dexTx.from, undefined, {
                ...selectedQuote,
                swapSlippage: value,
                approvalType: undefined,
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

    return (
        <Column gap={spacings.lg} alignItems="stretch" flex="1">
            <InfoRow label={<Translation id="TR_EXCHANGE_SEND_FROM" />} typographyStyle="hint">
                <AccountLabeling account={account} />
            </InfoRow>
            <InfoRow
                label={<Translation id="TR_EXCHANGE_SWAP_SEND_TO" values={translationValues} />}
                typographyStyle="hint"
            >
                {dexTx.to}
            </InfoRow>

            <Card
                fillType="default"
                margin={{ vertical: spacings.md }}
                label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE" />}
            >
                <ElevationContext baseElevation={0}>
                    <Column gap={spacings.lg} alignItems="stretch">
                        <InfoRow
                            label={
                                <Tooltip
                                    content={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_INFO" />}
                                    hasIcon
                                >
                                    <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_TOLERANCE" />
                                </Tooltip>
                            }
                            typographyStyle="hint"
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
                                        autoFocus
                                    />
                                )}
                            </Row>
                            {customSlippageError?.message ? (
                                <BottomText
                                    inputState={customSlippageError && 'error'}
                                    iconComponent={
                                        <Icon
                                            name="warningCircle"
                                            size="medium"
                                            color={getInputStateTextColor('error', theme)}
                                        />
                                    }
                                >
                                    <Translation id={customSlippageError?.message} />
                                </BottomText>
                            ) : null}
                        </InfoRow>

                        <InfoRow
                            label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_OFFERED" />}
                            typographyStyle="hint"
                        >
                            <FormattedCryptoAmount
                                value={receiveStringAmount}
                                symbol={cryptoIdToCoinSymbol(receive)}
                            />
                        </InfoRow>

                        <InfoRow
                            label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT" />}
                            typographyStyle="hint"
                        >
                            {`-${formatCryptoAmountAsAmount(
                                (Number(selectedQuote.swapSlippage) / 100) *
                                    Number(receiveStringAmount),
                                Number(receiveStringAmount),
                                decimals,
                            )} ${cryptoIdToCoinSymbol(receive)}`}
                        </InfoRow>

                        <InfoRow
                            label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM" />}
                            typographyStyle="hint"
                        >
                            {`${formatCryptoAmountAsAmount(
                                ((100 - Number(selectedQuote.swapSlippage)) / 100) *
                                    Number(receiveStringAmount),
                                Number(receiveStringAmount),
                                decimals,
                            )} ${cryptoIdToCoinSymbol(receive)}`}
                        </InfoRow>
                    </Column>
                </ElevationContext>
            </Card>

            <InfoRow label={<Translation id="TR_EXCHANGE_SWAP_DATA" />} typographyStyle="hint">
                <BreakableValue>{dexTx.data}</BreakableValue>
            </InfoRow>

            <Column>
                <Divider margin={{ top: spacings.xs, bottom: spacings.lg }} />
                <Button
                    isLoading={callInProgress}
                    isDisabled={callInProgress}
                    onClick={sendTransaction}
                >
                    <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                </Button>
            </Column>
        </Column>
    );
};
