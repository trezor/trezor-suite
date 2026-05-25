import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type AccountKey, type FormState, type TokenAddress } from '@suite-common/wallet-types';
import { type TokensRootState, selectAccountTokenBalance } from '@suite-native/tokens';
import { calculateFeeLevelsMaxAmountThunk } from '@suite-native/transaction-management';

type UseMaxSpendableAmountProps = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
};

const buildFormState = ({ tokenContract }: { tokenContract?: TokenAddress }): FormState => ({
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
}: UseMaxSpendableAmountProps) => {
    const dispatch = useDispatch();
    const [maxSpendableAmount, setMaxSpendableAmount] = useState<string | undefined>(undefined);

    const tokenBalance = useSelector((state: TokensRootState) =>
        selectAccountTokenBalance(state, accountKey, tokenContract),
    );

    useEffect(() => {
        if (!accountKey) {
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
                const { normal, economy } = await dispatch(
                    calculateFeeLevelsMaxAmountThunk(
                        {
                            formState: buildFormState({ tokenContract }),
                            accountKey,
                        },
                        { signal: controller.signal },
                    ),
                ).unwrap();

                if (!controller.signal.aborted) {
                    setMaxSpendableAmount(normal ?? economy);
                }
            } catch {
                if (controller.signal.aborted) return;
            }
        };

        calculateMaxAmount();

        return () => {
            controller.abort();
        };
    }, [dispatch, accountKey, tokenContract, tokenBalance]);

    return { maxSpendableAmount };
};
