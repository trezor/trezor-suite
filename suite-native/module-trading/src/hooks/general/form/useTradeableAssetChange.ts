import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { type UnknownAction } from '@reduxjs/toolkit';

import { useServices } from '@suite-common/dependency-injection';
import { type TradingType, cryptoIdToNetworkSymbol } from '@suite-common/trading';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { type FieldValues, type Path, type UseFormReturn } from '@suite-native/forms';
import { type TradeableAsset } from '@suite-native/trading-types';

type TradingParameter = 'cryptoFrom' | 'cryptoTo';

type CollisionConfig = {
    counterpartAssetField: string;
    counterpartAmountField?: string;
    counterpartAnalyticsParameter: TradingParameter;
    getCounterpartChangedAction?: () => UnknownAction;
};

type UseTradeableAssetChangeConfig<TFieldValues extends FieldValues> = {
    form: UseFormReturn<TFieldValues>;
    tradingType: TradingType;
    selectedValue: TradeableAsset | undefined;
    setSelectedValue: (asset: TradeableAsset) => void;
    analyticsParameter: TradingParameter;
    amountField?: string;
    getAssetChangedAction: () => UnknownAction;
    getAssetTokenChangedAction?: () => UnknownAction;
    getSetTradingAccountKeyAction?: (accountKey: AccountKey) => UnknownAction;
    collision?: CollisionConfig;
};

type ChangeAssetOptions = {
    shouldReportAnalytics?: boolean;
};

export const useTradeableAssetChange = <TFieldValues extends FieldValues>({
    form,
    tradingType,
    selectedValue,
    setSelectedValue,
    analyticsParameter,
    amountField,
    getAssetChangedAction,
    getAssetTokenChangedAction,
    getSetTradingAccountKeyAction,
    collision,
}: UseTradeableAssetChangeConfig<TFieldValues>) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const { setValue, getValues } = form;

    const reportParameterChanged = useCallback(
        (parameter: TradingParameter) => {
            analytics.report({
                type: events.tradingParameterChangedEvent.name,
                payload: { type: tradingType, parameter },
            });
        },
        [analytics, tradingType],
    );

    const clearField = useCallback(
        (field: string, shouldValidate: boolean) => {
            setValue(
                field as Path<TFieldValues>,
                undefined as never,
                shouldValidate ? { shouldValidate: true } : undefined,
            );
        },
        [setValue],
    );

    return useCallback(
        (asset: TradeableAsset, account?: Account, options?: ChangeAssetOptions) => {
            const { shouldReportAnalytics = true } = options ?? {};

            if (account && getSetTradingAccountKeyAction) {
                dispatch(getSetTradingAccountKeyAction(account.key));
            }

            if (asset.cryptoId === selectedValue?.cryptoId) {
                return;
            }

            const isTokenChange =
                cryptoIdToNetworkSymbol(selectedValue?.cryptoId) ===
                cryptoIdToNetworkSymbol(asset.cryptoId);

            setSelectedValue(asset);

            if (amountField) {
                clearField(amountField, true);
            }

            const counterpartAsset = collision
                ? (getValues(collision.counterpartAssetField as Path<TFieldValues>) as
                      TradeableAsset | undefined)
                : undefined;

            if (collision && asset.cryptoId === counterpartAsset?.cryptoId) {
                clearField(collision.counterpartAssetField, false);
                if (collision.counterpartAmountField) {
                    clearField(collision.counterpartAmountField, true);
                }
                if (collision.getCounterpartChangedAction) {
                    dispatch(collision.getCounterpartChangedAction());
                }
                reportParameterChanged(collision.counterpartAnalyticsParameter);
            }

            dispatch(
                isTokenChange && getAssetTokenChangedAction
                    ? getAssetTokenChangedAction()
                    : getAssetChangedAction(),
            );

            if (shouldReportAnalytics) {
                reportParameterChanged(analyticsParameter);
            }
        },
        [
            dispatch,
            selectedValue?.cryptoId,
            setSelectedValue,
            getValues,
            clearField,
            amountField,
            collision,
            analyticsParameter,
            getAssetChangedAction,
            getAssetTokenChangedAction,
            getSetTradingAccountKeyAction,
            reportParameterChanged,
        ],
    );
};
