import { Card } from '@trezor/components';

import useTradingVerifyAccount from 'src/hooks/wallet/trading/form/useTradingVerifyAccount';
import { TradingOfferBuyProps } from 'src/types/trading/tradingForm';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingVerify } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingVerify/TradingVerify';

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
    const tradingVerifyAccount = useTradingVerifyAccount({
        cryptoId,
        nonSuiteAccount: !selectedQuote.tags?.includes('noExternalAddress'),
    });

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
