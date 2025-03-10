import { useEffect } from 'react';

import { CryptoId } from 'invity-api';

import { SET_MODAL_CRYPTO_CURRENCY } from 'src/actions/wallet/constants/tradingCommonConstants';
import { useDispatch } from 'src/hooks/suite';

interface TradingModalCryptoProps {
    receiveCurrency: CryptoId | undefined;
}

/**
 * Will save CryptoId which is used in confirm modals later
 *
 * TODO: trading - change to new reducer after all sections are implemented
 */
export const useTradingModalCrypto = ({ receiveCurrency }: TradingModalCryptoProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch({
            type: SET_MODAL_CRYPTO_CURRENCY,
            modalCryptoId: receiveCurrency,
        });
    }, [receiveCurrency, dispatch]);

    // TODO: trading - could be moved to middleware to have safer cleanup
    // after unmount set off CryptoSymbol for modals
    useEffect(
        () => () => {
            dispatch({
                type: SET_MODAL_CRYPTO_CURRENCY,
                modalCryptoId: undefined,
            });
        },
        [dispatch],
    );
};
