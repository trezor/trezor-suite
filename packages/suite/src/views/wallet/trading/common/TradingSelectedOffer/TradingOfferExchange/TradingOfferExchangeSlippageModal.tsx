import { type ChangeEvent, useEffect, useState } from 'react';
import { type FieldError } from 'react-hook-form';
import { useDebounce } from 'react-use';

import { Translation, type TranslationKey } from '@suite/intl';
import {
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeType,
    useTradingUtils,
} from '@suite-common/trading';
import { Column, InfoItem, Input, Modal, Row, SelectBar, Text } from '@trezor/components';
import { BottomText } from '@trezor/components/src/components/form/BottomText';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { formatCryptoAmountAsAmount } from 'src/views/wallet/trading/common/formatCryptoAmountAsAmount';

const SLIPPAGE_MIN = '0.01';
const SLIPPAGE_MAX = '50';
const CUSTOM_SLIPPAGE = 'CUSTOM';

const slippageOptions = [
    { label: '0.1%', value: '0.1' },
    { label: '0.5%', value: '0.5' },
    { label: '1%', value: '1' },
    { label: '3%', value: '3' },
    { label: <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_CUSTOM" />, value: CUSTOM_SLIPPAGE },
];

interface TradingOfferExchangeSlippageModalProps {
    onClose: () => void;
}

export const TradingOfferExchangeSlippageModal = ({
    onClose,
}: TradingOfferExchangeSlippageModalProps) => {
    const {
        form: {
            state: { isFormLoading },
        },
        selectedQuote,
        getValues,
        confirmTrade,
    } = useTradingFormContext<TradingExchangeType>();

    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();

    const [slippage, setSlippage] = useState(selectedQuote?.swapSlippage ?? '1');
    const [customSlippage, setCustomSlippage] = useState(slippage);
    const [customSlippageError, setCustomSlippageError] = useState<
        (FieldError & { message: TranslationKey }) | undefined
    >();

    const sendCryptoSelect = getValues(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);
    const { getAssetDecimals } = useTradingAssetDecimals();
    const decimals = getAssetDecimals({
        accountKey: sendCryptoSelect?.accountKey,
        cryptoId: sendCryptoSelect?.id,
    });

    useEffect(() => {
        if (!slippageOptions.find(option => option.value === selectedQuote?.swapSlippage)) {
            setSlippage(CUSTOM_SLIPPAGE);
        }
    }, [selectedQuote?.swapSlippage]);

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

    const { coinSymbol: receiveCoinSymbol, contractAddress: receiveContractAddress } =
        cryptoIdToSymbolAndContractAddress(receive);

    const selectedSlippage =
        slippageOptions.find(option => option.value === slippage)?.value || CUSTOM_SLIPPAGE;

    const maximumSlippageAmount = `-${formatCryptoAmountAsAmount(
        (Number(selectedQuote.swapSlippage) / 100) * Number(receiveStringAmount),
        Number(receiveStringAmount),
        decimals,
    )}`;

    const minimumYouGetAmount = formatCryptoAmountAsAmount(
        ((100 - Number(selectedQuote.swapSlippage)) / 100) * Number(receiveStringAmount),
        Number(receiveStringAmount),
        decimals,
    );

    const changeSlippage = async (value: string) => {
        setSlippage(value);
        setCustomSlippage('1');
        setCustomSlippageError(undefined);

        if (value !== CUSTOM_SLIPPAGE) {
            setCustomSlippage(value);

            if (!selectedQuote.dexTx || !selectedQuote.receiveAddress) return;

            await confirmTrade({
                receiveAddress: selectedQuote.receiveAddress,
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

        setCustomSlippageError(() => {
            if (slippage.isNaN() || value.startsWith('.') || value.endsWith('.')) {
                return {
                    type: 'error',
                    message: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_NUMBER',
                };
            }

            if (slippage.lt(SLIPPAGE_MIN) || slippage.gt(SLIPPAGE_MAX)) {
                return {
                    type: 'error',
                    message: 'TR_EXCHANGE_SWAP_SLIPPAGE_NOT_IN_RANGE',
                };
            }

            return undefined;
        });
    };

    const onCloseModal = () => {
        // prevent closing the modal when the slippage is being confirmed
        if (isFormLoading) return;

        onClose();
    };

    return (
        <Modal
            heading={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT" />}
            onCancel={onCloseModal}
            width={600}
            bottomContent={
                <Modal.Button
                    isLoading={isFormLoading}
                    isDisabled={!!customSlippageError}
                    onClick={onCloseModal}
                >
                    <Translation id="TR_CLOSE" />
                </Modal.Button>
            }
        >
            <Column gap={spacings.md}>
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_INFO" />
                </Text>

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
                            hasError={!!customSlippageError}
                            name="CustomSlippage"
                            data-testid="CustomSlippage"
                            onChange={changeCustomSlippage}
                            width={100}
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                        />
                    )}
                </Row>

                {customSlippageError?.message && (
                    <BottomText hasError={!!customSlippageError} iconName="warningCircle">
                        <Translation id={customSlippageError?.message} />
                    </BottomText>
                )}

                <Column gap={spacings.xs}>
                    <InfoItem
                        label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_OFFERED" />}
                        direction="row"
                    >
                        <Text typographyStyle="body-sm">
                            <FormattedCryptoAmount
                                value={receiveStringAmount}
                                symbol={receiveCoinSymbol}
                                contractAddress={receiveContractAddress}
                            />
                        </Text>
                    </InfoItem>

                    <InfoItem
                        label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT" />}
                        direction="row"
                    >
                        <Text typographyStyle="body-sm">
                            <FormattedCryptoAmount
                                value={maximumSlippageAmount}
                                symbol={receiveCoinSymbol}
                                contractAddress={receiveContractAddress}
                            />
                        </Text>
                    </InfoItem>

                    <InfoItem
                        label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM" />}
                        direction="row"
                    >
                        <Text typographyStyle="body-sm">
                            <FormattedCryptoAmount
                                value={minimumYouGetAmount}
                                symbol={receiveCoinSymbol}
                                contractAddress={receiveContractAddress}
                            />
                        </Text>
                    </InfoItem>
                </Column>
            </Column>
        </Modal>
    );
};
