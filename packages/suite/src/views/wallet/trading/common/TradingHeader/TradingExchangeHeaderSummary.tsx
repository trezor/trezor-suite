import { type CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    type TradingExchangeType,
    selectTradingComposedTransactionInfo,
} from '@suite-common/trading';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { H3, Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';

interface TradingExchangeHeaderSummaryProps {
    sendAmount: string | number | undefined;
    sendCurrency: CryptoId | string | undefined;
    receiveCurrency: CryptoId | undefined;
}

export const TradingExchangeHeaderSummary = ({
    sendAmount,
    sendCurrency,
    receiveCurrency,
}: TradingExchangeHeaderSummaryProps) => {
    const context = useTradingFormContext<TradingExchangeType>();
    const { account } = context;
    const { symbol } = account;
    const fee = useSelector(selectTradingComposedTransactionInfo)?.composed?.fee;
    const feeAmount = formatNetworkAmount(fee || '0', symbol);

    return (
        <Row
            alignItems="center"
            justifyContent="space-between"
            gap={spacings.md}
            flexWrap="wrap"
            width="100%"
        >
            <Row alignItems="center" gap={spacings.sm} flexWrap="wrap">
                {sendCurrency && (
                    <H3>
                        <TradingCryptoAmount
                            amount={sendAmount}
                            cryptoId={sendCurrency as CryptoId}
                            displayLogo
                        />
                    </H3>
                )}
                <Icon intent="neutral" priority="secondary" name="arrowRight" />
                {receiveCurrency && (
                    <H3>
                        <TradingCryptoAmount cryptoId={receiveCurrency} displayLogo />
                    </H3>
                )}
            </Row>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation
                    id="TR_EXCHANGE_FEES_INFO"
                    values={{
                        feeAmount: (
                            <FormattedCryptoAmount
                                disableHiddenPlaceholder
                                value={feeAmount}
                                symbol={symbol}
                            />
                        ),
                        feeAmountFiat: (
                            <BaseCurrencyValue
                                disableHiddenPlaceholder
                                amount={feeAmount}
                                symbol={symbol}
                                rateType="current"
                            />
                        ),
                    }}
                />
            </Text>
        </Row>
    );
};
