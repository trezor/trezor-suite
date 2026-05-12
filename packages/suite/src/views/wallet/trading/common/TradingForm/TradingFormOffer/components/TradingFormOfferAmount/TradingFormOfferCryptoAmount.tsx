import { type CryptoId } from 'invity-api';

import { cryptoIdToNetwork, useTradingUtils } from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

interface TradingCryptoAmountProps {
    amount: string | number;
    cryptoId: CryptoId | undefined;
}

export const TradingFormOfferCryptoAmount = ({ amount, cryptoId }: TradingCryptoAmountProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoId);

    if (!coinSymbol) {
        return null;
    }

    const network = cryptoId && cryptoIdToNetwork(cryptoId);
    const hasAmount = amount && new BigNumber(amount).gt(0);

    return (
        <Column alignItems="start">
            <Row gap={8} alignItems="center">
                {cryptoId && <TradingCoinLogo cryptoId={cryptoId} />}
                <Text
                    data-testid="@trading/best-offer/amount"
                    typographyStyle="headline-md"
                    ellipsisLineCount={2}
                >
                    <FormattedCryptoAmount
                        value={amount}
                        symbol={coinSymbol}
                        contractAddress={contractAddress}
                        isRawString
                        disableHiddenPlaceholder
                        isBalance={false}
                    />
                </Text>
            </Row>
            {hasAmount && network && (
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    margin={{ left: 32 }}
                >
                    <BaseCurrencyValue
                        amount={amount.toString()}
                        tokenAddress={contractAddress as TokenAddress}
                        symbol={network.symbol}
                        rateType="current"
                        showApproximationIndicator
                    />
                </Text>
            )}
        </Column>
    );
};
