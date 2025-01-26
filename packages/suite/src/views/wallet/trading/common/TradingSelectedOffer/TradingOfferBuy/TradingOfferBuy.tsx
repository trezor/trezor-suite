import { Card } from '@trezor/components';

import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingVerify } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingVerify/TradingVerify';
import { TradingOfferBuyProps } from 'src/types/trading/tradingForm';
import useTradingVerifyAccount from 'src/hooks/wallet/trading/form/useTradingVerifyAccount';

export const TradingOfferBuy = ({
    account,
    selectedQuote,
    providers,
    type,
    quoteAmounts,
    paymentMethod,
    paymentMethodName,
}: TradingOfferBuyProps) => {
    const cryptoId = selectedQuote?.receiveCurrency;
    const tradingVerifyAccount = useTradingVerifyAccount({ cryptoId });

    return (
        <>
            <Card>
                {cryptoId && (
                    <TradingVerify
                        tradingVerifyAccount={tradingVerifyAccount}
                        cryptoId={cryptoId}
                    />
                )}
            </Card>
            <Card>
                <TradingSelectedOfferInfo
                    account={account}
                    selectedAccount={tradingVerifyAccount.selectedAccountOption?.account}
                    selectedQuote={selectedQuote}
                    providers={providers}
                    type={type}
                    quoteAmounts={quoteAmounts}
                    paymentMethod={paymentMethod}
                    paymentMethodName={paymentMethodName}
                />
            </Card>
        </>
    );
};
