import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import type { AccountKey, FormState, TokenAddress } from '@suite-common/wallet-types';
import { type TokensRootState, selectAccountTokenBalance } from '@suite-native/tokens';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { calculateFeeLevelsMaxAmountThunk } from '../thunks';

type UseMaxSpendableAmountProps = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
    formState?: FormState;
    enabled?: boolean;
    symbol?: NetworkSymbol | null;
    assumeNewAccount?: boolean;
    ethereumFixedGasLimit?: string;
};

const buildDefaultFormState = ({
    tokenContract,
    ethereumFixedGasLimit,
}: {
    tokenContract?: TokenAddress;
    ethereumFixedGasLimit?: string;
}): FormState => ({
    outputs: [
        {
            type: 'payment',
            address: '',
            amount: '0',
            label: '',
            token: tokenContract ?? null,
            fiat: '',
            currency: { label: '', value: '' },
        },
    ],
    selectedFee: 'normal',
    feePerUnit: '',
    feeLimit: '',
    options: [],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    ethereumFixedGasLimit,
});

export const useMaxSpendableAmount = ({
    accountKey,
    tokenContract,
    formState,
    enabled = true,
    symbol,
    assumeNewAccount,
    ethereumFixedGasLimit,
}: UseMaxSpendableAmountProps) => {
    const { dispatch } = useServices(injectDispatch);

    const [maxSpendableAmount, setMaxSpendableAmount] = useState<string | undefined>(undefined);

    const tokenBalance = useSelector((state: TokensRootState) =>
        selectAccountTokenBalance(state, accountKey, tokenContract),
    );
    const accountDescriptor = useSelector(
        (state: AccountsRootState) => selectAccountByKey(state, accountKey)?.descriptor,
    );

    useEffect(() => {
        if (!accountKey || !enabled || !symbol) {
            setMaxSpendableAmount(undefined);

            return;
        }

        if (tokenBalance) {
            setMaxSpendableAmount(tokenBalance);

            return;
        }

        const controller = new AbortController();

        const calculateMaxAmount = async () => {
            try {
                await dispatch(updateFeeInfoThunk({ networkSymbol: symbol })).unwrap();

                const { normal, economy, low, high } = await dispatch(
                    calculateFeeLevelsMaxAmountThunk(
                        {
                            formState:
                                formState ??
                                buildDefaultFormState({ tokenContract, ethereumFixedGasLimit }),
                            accountKey,
                            assumeNewAccount,
                        },
                        { signal: controller.signal },
                    ),
                ).unwrap();

                if (!controller.signal.aborted) {
                    setMaxSpendableAmount(high ?? normal ?? low ?? economy);
                }
            } catch {
                if (controller.signal.aborted) {
                    return;
                }

                setMaxSpendableAmount(undefined);
            }
        };

        calculateMaxAmount();

        return () => {
            controller.abort();
        };
    }, [
        dispatch,
        accountKey,
        tokenContract,
        formState,
        tokenBalance,
        accountDescriptor,
        enabled,
        symbol,
        assumeNewAccount,
        ethereumFixedGasLimit,
    ]);

    return { maxSpendableAmount };
};
