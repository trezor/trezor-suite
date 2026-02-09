import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { TradingRootState } from '../reducers/tradingCommonReducer';
import { tradingActions } from '../reducers/tradingCommonReducer';
import {
    selectTradingProviderByNameAndTradeType,
    selectTradingProviderMetadata,
} from '../selectors/tradingSelectors';
import type { TradingType } from '../types';

export const useProviderMetadataChangeEffect = (tradingType: TradingType, quoteName?: string) => {
    const dispatch = useDispatch();

    const providerMetadata = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quoteName, tradingType),
    );
    const currentProviderMetadata = useSelector(selectTradingProviderMetadata);

    useEffect(() => {
        if (!quoteName && providerMetadata) {
            dispatch(tradingActions.setCurrentProviderMetadata(undefined));
        }
    }, [dispatch, quoteName, providerMetadata]);

    useEffect(() => {
        if (providerMetadata === currentProviderMetadata) {
            return;
        }

        dispatch(tradingActions.setCurrentProviderMetadata(providerMetadata));
    }, [providerMetadata, currentProviderMetadata, dispatch]);

    useEffect(
        () => () => {
            dispatch(tradingActions.setCurrentProviderMetadata(undefined));
        },
        [dispatch],
    );

    return currentProviderMetadata;
};
