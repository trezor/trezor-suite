import { useCallback, useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { D, pipe } from '@mobily/ts-belt';
import { isFulfilled } from '@reduxjs/toolkit';

import { useServices } from '@suite-common/dependency-injection';
import { selectAddressValidatorDep, selectGetNamedAddressSupportDep } from '@suite-common/networks';
import { selectDispatch } from '@suite-common/redux-utils';
import { getExcludedUtxos } from '@suite-common/transaction-search';
import {
    type NetworkSymbol,
    type NetworkType,
    getDisplaySymbol,
    getNetwork,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FeesRootState,
    type SendRootState,
    type WalletSettingsRootState,
    composeSendFormTransactionFeeLevelsThunk,
    selectAccountAvailableBalance,
    selectAccountDescriptor,
    selectAccountNetworkSymbol,
    selectConvertedNetworkFeeInfo,
    selectIsAmountInSats,
    selectIsNetworkReserveEnabled,
    selectNetworkFeeStatus,
    selectSendFormDraftByKey,
    sendFormActions,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { formatNetworkAmount, getNetworkReserve } from '@suite-common/wallet-utils';
import { useForm } from '@suite-native/forms';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import {
    type NativeSendRootState,
    calculateFeeLevelsMaxAmountThunk,
    selectFeeLevelsMaxAmountBySendKey,
    transactionManagementActions,
    useSubscribeForSolanaBlockUpdates,
} from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';

import {
    selectSendFormAccountAnonymitySet,
    selectSendFormAccountRippleReserve,
    selectSendFormAccountUtxos,
} from '../selectors';
import {
    type SendOutputsFormValues,
    sendOutputsFormValidationSchema,
} from '../sendOutputsFormSchema';
import { constructFormDraft } from '../utils';
import { useUtxoSelection } from './useUtxoSelection';

const getDefaultValues = ({
    tokenContract,
    isDestinationTagEnabled,
}: {
    tokenContract?: TokenAddress;
    isDestinationTagEnabled: boolean;
}): Readonly<SendOutputsFormValues> =>
    ({
        isDestinationTagEnabled,
        outputs: [
            {
                amount: '',
                address: '',
                fiat: '',
                token: tokenContract ?? null,
            },
        ],
    }) as const;

const getRippleReserve = (
    reserve: string | undefined,
    networkType: NetworkType,
    accountSymbol: NetworkSymbol,
) => {
    if (networkType !== 'ripple' || !reserve) return undefined;

    return formatNetworkAmount(reserve, accountSymbol);
};

export const useSendForm = (accountKey: AccountKey, tokenContract?: TokenAddress) => {
    const debounce = useDebounce();
    const { addressValidator, getNamedAddressSupport, dispatch } = useServices(
        selectAddressValidatorDep,
        selectGetNamedAddressSupportDep,
        selectDispatch,
    );

    const { selectedUtxos } = useUtxoSelection(accountKey);

    const accountSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const accountDescriptor = useSelector((state: AccountsRootState) =>
        selectAccountDescriptor(state, accountKey),
    );
    const accountAvailableBalance = useSelector((state: AccountsRootState) =>
        selectAccountAvailableBalance(state, accountKey),
    );
    const accountUtxos = useSelector((state: AccountsRootState) =>
        selectSendFormAccountUtxos(state, accountKey),
    );
    const accountAnonymitySet = useSelector((state: AccountsRootState) =>
        selectSendFormAccountAnonymitySet(state, accountKey),
    );
    const accountRippleReserve = useSelector((state: AccountsRootState) =>
        selectSendFormAccountRippleReserve(state, accountKey),
    );

    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, accountSymbol ?? undefined),
    );
    const isNetworkReserveEnabled = useSelector((state: WalletSettingsRootState) =>
        selectIsNetworkReserveEnabled(state),
    );
    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, accountSymbol ?? undefined),
    );
    const networkFeeStatus = useSelector((state: FeesRootState) =>
        selectNetworkFeeStatus(state, accountSymbol ?? undefined),
    );
    const sendFormDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );
    const feeAdjustedMaxSendAmountByLevel = useSelector((state: NativeSendRootState) =>
        selectFeeLevelsMaxAmountBySendKey(state, accountKey, tokenContract),
    );

    const excludedUtxos = useMemo(
        () =>
            getExcludedUtxos({
                utxos: accountUtxos ?? [],
                anonymitySet: accountAnonymitySet,
                dustLimit: networkFeeInfo?.dustLimit,
            }),
        [accountUtxos, accountAnonymitySet, networkFeeInfo?.dustLimit],
    );

    const network = accountSymbol ? getNetwork(accountSymbol) : null;

    useSubscribeForSolanaBlockUpdates({
        symbol: accountSymbol,
        networkType: network?.networkType ?? null,
    });

    const namedAddress = getNamedAddressSupport(accountSymbol ?? undefined);

    const networkReserve = accountSymbol
        ? getNetworkReserve({
              symbol: accountSymbol,
              contractAddress: tokenContract,
              isEnabled: isNetworkReserveEnabled,
          })
        : undefined;

    const rippleReserve =
        network && accountSymbol
            ? getRippleReserve(accountRippleReserve, network.networkType, accountSymbol)
            : undefined;

    const form = useForm<SendOutputsFormValues>({
        validation: sendOutputsFormValidationSchema,
        // If the form is prefilled with the draft values, we want to revalidate the draft on every change.
        mode: sendFormDraft ? 'onChange' : 'onTouched',
        context: {
            addressValidator,
            networkFeeInfo,
            accountDescriptor: accountDescriptor ?? undefined,
            symbol: accountSymbol ?? undefined,
            availableBalanceBeforeFees: tokenInfo?.balance ?? accountAvailableBalance,
            isTokenFlow: !!tokenContract,
            isValueInSats: isAmountInSats,
            feeAdjustedMaxSendAmountByLevel,
            networkFeeStatus: networkFeeStatus ?? undefined,
            decimals: tokenInfo?.decimals ?? network?.decimals,
            nativeCurrencyBalanceAvailableForFees: accountAvailableBalance,
            networkReserve,
            rippleReserve,
            namedAddress,
        },
        defaultValues: getDefaultValues({
            tokenContract,
            isDestinationTagEnabled:
                network?.networkType === 'ripple' || network?.networkType === 'stellar',
        }),
    });

    const { control, getValues, trigger, setError } = form;
    const watchedFormValues = useWatch({ control });
    const watchedAddress = useWatch({ name: 'outputs.0.address', control });

    const updateFormState = useCallback(async () => {
        if (accountSymbol && network && networkFeeInfo) {
            const response = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState: constructFormDraft({
                        formValues: getValues(),
                        tokenContract,
                        selectedUtxos,
                    }),
                    composeContext: {
                        accountKey,
                        network,
                        feeInfo: networkFeeInfo,
                        excludedUtxos,
                    },
                }),
            );

            if (isFulfilled(response)) {
                const isReserveError = pipe(
                    response.payload,
                    D.filter(
                        feeLevel =>
                            feeLevel.type === 'error' &&
                            feeLevel.error === 'AMOUNT_IS_LESS_THAN_RESERVE',
                    ),
                    D.isNotEmpty,
                );

                if (isReserveError) {
                    setError('outputs.0.amount', {
                        message: `Recipient account requires minimum reserve of 1 ${getDisplaySymbol(accountSymbol)} to activate.`,
                    });
                }

                const normalFeeLevel = networkFeeInfo?.levels.find(
                    level => level.label === 'normal',
                );

                dispatch(
                    sendFormActions.storeDraft({
                        accountKey,
                        tokenContract,
                        formState: constructFormDraft({
                            formValues: getValues(),
                            tokenContract,
                            feeLevel: normalFeeLevel,
                            selectedUtxos,
                        }),
                    }),
                );

                dispatch(
                    transactionManagementActions.storeFeeLevels({
                        feeLevels: response.payload,
                    }),
                );

                trigger();
            }
        }
    }, [
        accountKey,
        dispatch,
        getValues,
        tokenContract,
        accountSymbol,
        network,
        networkFeeInfo,
        setError,
        excludedUtxos,
        selectedUtxos,
        trigger,
    ]);

    const calculateMaxSendAmountByFeeLevel = useCallback(async () => {
        const response = await dispatch(
            calculateFeeLevelsMaxAmountThunk({
                formState: constructFormDraft({ formValues: getValues(), selectedUtxos }),
                accountKey,
            }),
        );

        if (isFulfilled(response)) {
            dispatch(
                transactionManagementActions.storeFeeLevelsMaxAmount({
                    accountKey,
                    tokenContract,
                    feeLevelsMaxAmount: response.payload,
                }),
            );
        }
    }, [getValues, accountKey, dispatch, selectedUtxos, tokenContract]);

    useEffect(() => {
        const prefillValuesFromStoredDraft = async () => {
            if (sendFormDraft?.outputs) {
                form.reset({
                    ...getDefaultValues({
                        tokenContract,
                        isDestinationTagEnabled:
                            network?.networkType === 'ripple' || network?.networkType === 'stellar',
                    }),
                    ...sendFormDraft,
                });

                // The max amount is equal to the total token balance for tokens. (fee is paid in mainnet currency)
                if (!tokenContract) await calculateMaxSendAmountByFeeLevel();

                // We need to wait for the context to hydrate before validating the form with the draft values.
                setTimeout(() => {
                    trigger();
                }, 0);
            }
        };

        prefillValuesFromStoredDraft();
        // this effect should be triggered only for the first render to fill the form with the stored draft on entry.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Triggered for every change of watchedFormValues.
    useEffect(() => {
        debounce(updateFormState);
    }, [updateFormState, watchedFormValues, debounce, selectedUtxos, isNetworkReserveEnabled]);

    useEffect(() => {
        // The max amount is equal to the total token balance for tokens. (fee is paid in mainnet currency)
        if (!tokenContract) calculateMaxSendAmountByFeeLevel();
    }, [
        watchedAddress,
        calculateMaxSendAmountByFeeLevel,
        networkFeeInfo,
        tokenContract,
        isNetworkReserveEnabled,
    ]);

    // TODO: Fetch periodically. So if the user stays on the screen for a long time, the fee info is updated in the background.
    useEffect(() => {
        if (accountSymbol) {
            dispatch(
                transactionManagementActions.clearFeeLevelsMaxAmount({
                    accountKey,
                    tokenContract,
                }),
            );
            dispatch(updateFeeInfoThunk({ networkSymbol: accountSymbol }));
        }
    }, [accountKey, accountSymbol, dispatch, tokenContract]);

    if (!accountSymbol || !networkFeeInfo) return null;

    return {
        form,
    };
};
