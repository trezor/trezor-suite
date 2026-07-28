import { useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingBuyFormProps,
    type TradingTradeType,
    selectTradingBuyOfferQuotes,
} from '@suite-common/trading';
import { Box, Modal } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { TradingOffersModalGroup } from './TradingOffersModalGroup';

type TradingOffersModalBuyProps = {
    onClose: () => void;
};

export const TradingOffersModalBuy = ({ onClose }: TradingOffersModalBuyProps) => {
    const { control, getValues, setValue } = useFormContext<TradingBuyFormProps>();
    const paymentMethod = useWatch({ control, name: TRADING_FORM_PAYMENT_METHOD_SELECT });
    const quotes = useSelector(state => selectTradingBuyOfferQuotes(state, paymentMethod?.value));

    const handleSelect = useCallback(
        (quote: TradingTradeType) => {
            if (quote.exchange && quote.exchange !== getValues(TRADING_FORM_PROVIDER_SELECT)) {
                setValue(TRADING_FORM_PROVIDER_SELECT, quote.exchange);
            }

            if (
                'paymentMethod' in quote &&
                quote.paymentMethod &&
                quote.paymentMethod !== getValues(TRADING_FORM_PAYMENT_METHOD_SELECT)?.value
            ) {
                setValue(TRADING_FORM_PAYMENT_METHOD_SELECT, {
                    value: quote.paymentMethod,
                    label: quote.paymentMethodName ?? quote.paymentMethod,
                });
            }

            onClose();
        },
        [getValues, setValue, onClose],
    );

    return (
        <Modal
            onCancel={onClose}
            isBackdropCancelable
            heading={<Translation id="TR_TRADING_SHOW_OFFERS" />}
            data-testid="@trading/offers/modal"
            width={600}
            maxHeight={680}
        >
            <Box padding={{ bottom: 16 }}>
                <TradingOffersModalGroup quotes={quotes} onSelect={handleSelect} />
            </Box>
        </Modal>
    );
};
