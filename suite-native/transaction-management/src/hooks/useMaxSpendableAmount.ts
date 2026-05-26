import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type AccountKey, type FormState, type TokenAddress } from '@suite-common/wallet-types';
import { type TokensRootState, selectAccountTokenBalance } from '@suite-native/tokens';
import { useDebounce } from '@trezor/react-utils';

import { calculateFeeLevelsMaxAmountThunk } from '../thunks';

type UseMaxSpendableAmountProps = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
    formState?: FormState;
    enabled?: boolean;
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
}: UseMaxSpendableAmountProps) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();

    const [maxSpendableAmount, setMaxSpendableAmount] = useState<string | undefined>(undefined);

    const tokenBalance = useSelector((state: TokensRootState) =>
        selectAccountTokenBalance(state, accountKey, tokenContract),
    );

    useEffect(() => {
        if (!accountKey || !enabled) {
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
                const { normal, economy, low, high } = await debounce(
                    async () =>
                        await dispatch(
                            calculateFeeLevelsMaxAmountThunk(
                                {
                                    formState:
                                        formState ?? buildDefaultFormState({ tokenContract }),
                                    accountKey,
                                },
                                { signal: controller.signal },
                            ),
                        ).unwrap(),
                );

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
    }, [dispatch, accountKey, tokenContract, formState, tokenBalance, debounce, enabled]);

    return { maxSpendableAmount };
};
