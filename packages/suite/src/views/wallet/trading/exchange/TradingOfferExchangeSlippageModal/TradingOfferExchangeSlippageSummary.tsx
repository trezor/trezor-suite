import { Fragment } from 'react';
import { useFormContext } from 'react-hook-form';

import { type ExchangeTrade } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import {
    type SlippageFormValues,
    selectTradingExchangeReceiveAccountKey,
    useTradingUtils,
} from '@suite-common/trading';
import { Column, Divider, Row, Text, TextButton } from '@trezor/components';
import { ArrowLineUpRightIcon } from '@trezor/icons';
import { TREZOR_TRADING_DEX_SLIPPAGE_URL } from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { formatCryptoAmountAsAmount } from 'src/views/wallet/trading/common/formatCryptoAmountAsAmount';

interface TradingOfferExchangeSlippageSummaryProps {
    selectedQuote: ExchangeTrade;
    receiveAmount?: string;
}

export const TradingOfferExchangeSlippageSummary = ({
    selectedQuote,
    receiveAmount = selectedQuote.receiveStringAmount,
}: TradingOfferExchangeSlippageSummaryProps) => {
    // React Compiler: `watch` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const { getAssetDecimals } = useTradingAssetDecimals();
    const { watch, formState } = useFormContext<SlippageFormValues>();
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);

    const { receive } = selectedQuote;
    const slippageValue = watch('slippage');

    const decimals = getAssetDecimals({ accountKey: receiveAccountKey, cryptoId: receive });

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(receive);

    const previewSlippage =
        !formState.errors.slippage && slippageValue !== ''
            ? slippageValue
            : selectedQuote.swapSlippage;

    const receiveAmountBigNumber = new BigNumber(receiveAmount ?? '');
    const quoteReceiveAmount = new BigNumber(selectedQuote.receiveStringAmount ?? '');
    const minimumReceiveAmount = quoteReceiveAmount.minus(
        quoteReceiveAmount.multipliedBy(previewSlippage ?? '').dividedBy(100),
    );
    const slippageDeduction = minimumReceiveAmount.minus(receiveAmountBigNumber);

    const rows: {
        label: TranslationKey;
        value?: string;
        isSummaryRow?: boolean;
    }[] = [
        { label: 'TR_EXCHANGE_SWAP_SLIPPAGE_OFFERED', value: receiveAmount },
        {
            label: 'TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT',
            value: formatCryptoAmountAsAmount(slippageDeduction, receiveAmountBigNumber, decimals),
        },
        {
            label: 'TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM',
            value: formatCryptoAmountAsAmount(
                minimumReceiveAmount,
                receiveAmountBigNumber,
                decimals,
            ),
            isSummaryRow: true,
        },
    ];

    return (
        <Column gap={20}>
            <Column gap={12}>
                {rows.map(({ label, value, isSummaryRow }) => (
                    <Fragment key={label}>
                        {isSummaryRow && <Divider margin={0} />}
                        <Row justifyContent="space-between">
                            <Text typographyStyle="body-md" color="contentSecondary">
                                <Translation id={label} />
                            </Text>
                            <Text typographyStyle={isSummaryRow ? 'body-md-strong' : 'body-md'}>
                                <FormattedCryptoAmount
                                    value={value}
                                    symbol={coinSymbol}
                                    contractAddress={contractAddress}
                                />
                            </Text>
                        </Row>
                    </Fragment>
                ))}
            </Column>

            <TextButton
                iconRight={ArrowLineUpRightIcon}
                isUnderlined
                href={TREZOR_TRADING_DEX_SLIPPAGE_URL}
            >
                <Translation id="TR_LEARN_MORE" />
            </TextButton>
        </Column>
    );
};
