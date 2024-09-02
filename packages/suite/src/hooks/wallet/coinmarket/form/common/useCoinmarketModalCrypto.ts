import { CryptoSymbol } from 'invity-api';
import { useEffect } from 'react';
import { SET_MODAL_CRYPTO_CURRENCY } from 'src/actions/wallet/constants/coinmarketCommonConstants';
import { useDispatch } from 'src/hooks/suite';

interface CoinmarketModalCryptoProps {
    receiveCurrency: CryptoSymbol | undefined;
}

export const useCoinmarketModalCrypto = ({ receiveCurrency }: CoinmarketModalCryptoProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch({
            type: SET_MODAL_CRYPTO_CURRENCY,
            modalCryptoSymbol: receiveCurrency,
        });
    }, [receiveCurrency, dispatch]);

    // after unmount set off CryptoSymbol for modals
    useEffect(() => {
        return () => {
            dispatch({
                type: SET_MODAL_CRYPTO_CURRENCY,
                modalCryptoSymbol: undefined,
            });
        };
    }, [dispatch]);
};
