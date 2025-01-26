import { useEffect } from 'react';

import { CryptoId } from 'invity-api';

import { SET_MODAL_CRYPTO_CURRENCY } from 'src/actions/wallet/constants/tradingCommonConstants';
import { useDispatch } from 'src/hooks/suite';

interface TradingModalCryptoProps {
    receiveCurrency: CryptoId | undefined;
}

export const useTradingModalCrypto = ({ receiveCurrency }: TradingModalCryptoProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch({
            type: SET_MODAL_CRYPTO_CURRENCY,
            modalCryptoId: receiveCurrency,
        });
    }, [receiveCurrency, dispatch]);

    // after unmount set off CryptoSymbol for modals
    // eslint-disable-next-line arrow-body-style
    useEffect(() => {
        return () => {
            dispatch({
                type: SET_MODAL_CRYPTO_CURRENCY,
                modalCryptoId: undefined,
            });
        };
    }, [dispatch]);
};
