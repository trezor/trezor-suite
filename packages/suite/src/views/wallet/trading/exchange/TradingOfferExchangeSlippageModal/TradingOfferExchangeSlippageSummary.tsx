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
import { TREZOR_TRADING_DEX_SLIPPAGE_URL } from '@trezor/urls';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { formatCryptoAmountAsAmount } from 'src/views/wallet/trading/common/formatCryptoAmountAsAmount';

interface TradingOfferExchangeSlippageSummaryProps {
    selectedQuote: ExchangeTrade;
}

export const TradingOfferExchangeSlippageSummary = ({
    selectedQuote,
}: TradingOfferExchangeSlippageSummaryProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const { getAssetDecimals } = useTradingAssetDecimals();
    const { watch, formState } = useFormContext<SlippageFormValues>();
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);

    const { receive, receiveStringAmount } = selectedQuote;
    const slippageValue = watch('slippage');

    const decimals = getAssetDecimals({ accountKey: receiveAccountKey, cryptoId: receive });

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(receive);

    const previewSlippage =
        !formState.errors.slippage && slippageValue !== ''
            ? Number(slippageValue)
            : Number(selectedQuote.swapSlippage);

    const receiveAmount = Number(receiveStringAmount);

    const toAmount = (fraction: number) =>
        formatCryptoAmountAsAmount(fraction * receiveAmount, receiveAmount, decimals);

    const rows: {
        label: TranslationKey;
        value?: string;
        isSummaryRow?: boolean;
    }[] = [
        { label: 'TR_EXCHANGE_SWAP_SLIPPAGE_OFFERED', value: receiveStringAmount },
        { label: 'TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT', value: `-${toAmount(previewSlippage / 100)}` },
        {
            label: 'TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM',
            value: toAmount((100 - previewSlippage) / 100),
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
                iconRight="arrowLineUpRight"
                isUnderlined
                href={TREZOR_TRADING_DEX_SLIPPAGE_URL}
            >
                <Translation id="TR_LEARN_MORE" />
            </TextButton>
        </Column>
    );
};
