import { CryptoId } from 'invity-api';
import { useTheme } from 'styled-components';

import type { TradingExchangeType } from '@suite-common/trading';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { H3, Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
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
    const theme = useTheme();
    const context = useTradingFormContext<TradingExchangeType>();
    const { account } = context;
    const { symbol } = account;
    const fee = useSelector(state => state.wallet.trading.composedTransactionInfo.composed?.fee);
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
                <Icon variant="tertiary" name="arrowRightLong" />
                {receiveCurrency && (
                    <H3>
                        <TradingCryptoAmount cryptoId={receiveCurrency} displayLogo />
                    </H3>
                )}
            </Row>
            <Text typographyStyle="hint" color={theme.textSubdued}>
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
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={feeAmount}
                                symbol={symbol}
                            />
                        ),
                    }}
                />
            </Text>
        </Row>
    );
};
