import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { updateFeeInfoThunk } from '@suite-common/wallet-core';
import { type AccountKey, type FormState, type TokenAddress } from '@suite-common/wallet-types';
import { type TokensRootState, selectAccountTokenBalance } from '@suite-native/tokens';

import { calculateFeeLevelsMaxAmountThunk } from '../thunks';

type UseMaxSpendableAmountProps = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
    formState?: FormState;
    enabled?: boolean;
    symbol?: NetworkSymbol | null;
};

const buildDefaultFormState = ({ tokenContract }: { tokenContract?: TokenAddress }): FormState => ({
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
});

export const useMaxSpendableAmount = ({
    accountKey,
    tokenContract,
    formState,
    enabled = true,
    symbol,
}: UseMaxSpendableAmountProps) => {
    const dispatch = useDispatch();

    const [maxSpendableAmount, setMaxSpendableAmount] = useState<string | undefined>(undefined);

    const tokenBalance = useSelector((state: TokensRootState) =>
        selectAccountTokenBalance(state, accountKey, tokenContract),
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
                            formState: formState ?? buildDefaultFormState({ tokenContract }),
                            accountKey,
                        },
                        { signal: controller.signal },
                    ),
                ).unwrap();

                if (!controller.signal.aborted) {
                    setMaxSpendableAmount(high ?? normal ?? low ?? economy);
                }
            } catch {
                if (controller.signal.aborted) return;
                setMaxSpendableAmount(undefined);
            }
        };

        calculateMaxAmount();

        return () => {
            controller.abort();
        };
    }, [dispatch, accountKey, tokenContract, formState, tokenBalance, enabled, symbol]);

    return { maxSpendableAmount };
};
