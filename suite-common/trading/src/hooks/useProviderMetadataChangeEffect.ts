import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { TradingRootState } from '../reducers/tradingCommonReducer';
import { tradingActions } from '../reducers/tradingCommonReducer';
import {
    selectTradingProviderByNameAndTradeType,
    selectTradingProviderMetadata,
} from '../selectors/tradingSelectors';
import type { TradingType } from '../types';

export const useProviderMetadataChangeEffect = (
    tradingType: TradingType,
    quoteName?: string,
    areProviderChangesAllowed = true,
) => {
    const dispatch = useDispatch();

    const providerMetadata = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quoteName, tradingType),
    );
    const currentProviderMetadata = useSelector(selectTradingProviderMetadata);

    useEffect(() => {
        if (!areProviderChangesAllowed) {
            return;
        }

        if (providerMetadata === currentProviderMetadata) {
            return;
        }

        dispatch(tradingActions.setCurrentProviderMetadata(providerMetadata));
    }, [providerMetadata, currentProviderMetadata, dispatch, areProviderChangesAllowed]);

    useEffect(
        () => () => {
            dispatch(tradingActions.setCurrentProviderMetadata(undefined));
        },
        [dispatch],
    );

    return currentProviderMetadata;
};
