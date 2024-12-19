import { Card } from '@trezor/components';

import { CoinmarketSelectedOfferInfo } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferInfo';
import { CoinmarketVerify } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketVerify/CoinmarketVerify';
import { CoinmarketOfferBuyProps } from 'src/types/coinmarket/coinmarketForm';
import useCoinmarketVerifyAccount from 'src/hooks/wallet/coinmarket/form/useCoinmarketVerifyAccount';

export const CoinmarketOfferBuy = ({
    account,
    selectedQuote,
    providers,
    type,
    quoteAmounts,
    paymentMethod,
    paymentMethodName,
}: CoinmarketOfferBuyProps) => {
    const cryptoId = selectedQuote?.receiveCurrency;
    const coinmarketVerifyAccount = useCoinmarketVerifyAccount({ cryptoId });

    return (
        <>
            <Card>
                {cryptoId && (
                    <CoinmarketVerify
                        coinmarketVerifyAccount={coinmarketVerifyAccount}
                        cryptoId={cryptoId}
                    />
                )}
            </Card>
            <Card>
                <CoinmarketSelectedOfferInfo
                    account={account}
                    selectedAccount={coinmarketVerifyAccount.selectedAccountOption?.account}
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
