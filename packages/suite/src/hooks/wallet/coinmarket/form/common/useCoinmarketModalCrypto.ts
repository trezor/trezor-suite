import { CryptoId } from 'invity-api';
import { useEffect } from 'react';
import { SET_MODAL_CRYPTO_CURRENCY } from 'src/actions/wallet/constants/coinmarketCommonConstants';
import { useDispatch } from 'src/hooks/suite';

interface CoinmarketModalCryptoProps {
    receiveCurrency: CryptoId | undefined;
}

export const useCoinmarketModalCrypto = ({ receiveCurrency }: CoinmarketModalCryptoProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch({
            type: SET_MODAL_CRYPTO_CURRENCY,
            modalCryptoId: receiveCurrency,
        });
    }, [receiveCurrency, dispatch]);

    // after unmount set off CryptoSymbol for modals
    useEffect(() => {
        return () => {
            dispatch({
                type: SET_MODAL_CRYPTO_CURRENCY,
                modalCryptoId: undefined,
            });
        };
    }, [dispatch]);
};
