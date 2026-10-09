import { useEffect, useEffectEvent } from 'react';
import { useSelector } from 'react-redux';

import { injectDispatch } from '@suite-common/redux-utils';
import { type TradingType } from '@suite-common/trading';
import { selectTradingFormResetRequestedFor, tradingActions } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';

type UseTradingFormResetRequestParams = {
    tradeType: TradingType;
    resetForm: () => void;
};

export const useTradingFormResetRequest = ({
    tradeType,
    resetForm,
}: UseTradingFormResetRequestParams) => {
    const { dispatch } = useServices(injectDispatch);
    const formResetRequestedFor = useSelector(selectTradingFormResetRequestedFor);
    const isResetRequested = formResetRequestedFor === tradeType;

    const handleResetRequest = useEffectEvent(() => {
        resetForm();
        dispatch(tradingActions.clearTradingFormResetRequest());
    });

    useEffect(() => {
        if (isResetRequested) {
            handleResetRequest();
        }
    }, [isResetRequested]);
};
