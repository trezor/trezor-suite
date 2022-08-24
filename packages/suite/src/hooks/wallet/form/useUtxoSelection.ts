import { useEffect, useMemo, useCallback } from 'react';
import { UseFormMethods } from 'react-hook-form';

import { UseSendFormState } from '@suite-common/wallet-types';
import type { AccountUtxo } from '@trezor/connect';

type Props = UseFormMethods &
    Pick<UseSendFormState, 'account' | 'composedLevels' | 'feeInfo'> & {
        composeRequest: (field?: string) => void;
    };

export const useUtxoSelection = ({
    account,
    composedLevels,
    composeRequest,
    feeInfo,
    register,
    setValue,
    watch,
}: Props) => {
    // register custom form field (without HTMLElement)
    useEffect(() => {
        register({ name: 'isCoinControlEnabled', type: 'custom' });
        register({ name: 'selectedUtxos', type: 'custom' });
    }, [register]);

    const isCoinControlEnabled = watch('isCoinControlEnabled');
    const selectedUtxos: AccountUtxo[] = watch('selectedUtxos') || [];
    const selectedFee = watch('selectedFee');

    // split all UTXOs into two arrays based on their value to separate UTXOs that do not excceed the dust limit
    const [spendableUtxos, dustUtxos]: [AccountUtxo[], AccountUtxo[]] = account.utxo
        ? account.utxo.reduce(
              ([previousSpendable, previousDust]: [AccountUtxo[], AccountUtxo[]], current) =>
                  feeInfo.dustLimit && parseInt(current.amount, 10) >= feeInfo.dustLimit
                      ? [[...previousSpendable, current], previousDust]
                      : [previousSpendable, [...previousDust, current]],
              [[], []],
          )
        : [[], []];

    // are all available UTXOs selected in the form?
    const allUtxosSelected =
        !!selectedUtxos.length && selectedUtxos.length === spendableUtxos.length;

    // transaction composed by Suite for the fee level chosen by the user
    const composedLevel = composedLevels?.[selectedFee || 'normal'];

    // inputs selected automatically by Suite
    const composedInputs = useMemo(
        () =>
            composedLevel && 'transaction' in composedLevel ? composedLevel.transaction.inputs : [],
        [composedLevel],
    ) as PROTO.TxInputType[];

    // UTXOs corresponding to the inputs selected automatically
    const preselectedUtxos = useMemo(
        () =>
            account.utxo?.filter(utxo =>
                composedInputs.some(
                    input => input.prev_hash === utxo.txid && input.prev_index === utxo.vout,
                ),
            ) || [],
        [account.utxo, composedInputs],
    );

    // uncheck all UTXOs or check all and enable coin control
    const toggleCheckAllUtxos = useCallback(() => {
        if (allUtxosSelected) {
            setValue('selectedUtxos', []);
        } else {
            setValue('selectedUtxos', spendableUtxos);
            setValue('isCoinControlEnabled', true);
        }
        composeRequest();
    }, [allUtxosSelected, spendableUtxos, setValue, composeRequest]);

    // enable coin control or disable it and reset selected UTXOs
    const toggleCoinControl = () => {
        setValue('isCoinControlEnabled', !isCoinControlEnabled);
        setValue('selectedUtxos', isCoinControlEnabled ? [] : preselectedUtxos);
        composeRequest();
    };

    // uncheck a UTXO or check it and enable coin control
    const toggleUtxoSelection = (utxo: AccountUtxo) => {
        const isSameUtxo = (u: AccountUtxo) => u.txid === utxo.txid && u.vout === utxo.vout;

        const isSelected = selectedUtxos.find(isSameUtxo);
        if (isSelected) {
            // uncheck the UTXO if already selected
            setValue('selectedUtxos', selectedUtxos.filter(u => u !== isSelected) || []);
        } else {
            const selectedUtxosOld = !isCoinControlEnabled ? preselectedUtxos : selectedUtxos;

            // check the UTXO
            // however, in case the coin control has not been enabled and the UTXO has been preselected, do not check it
            const selectedUtxosNew = preselectedUtxos.find(isSameUtxo)
                ? preselectedUtxos
                : [...selectedUtxosOld, utxo];

            setValue('selectedUtxos', selectedUtxosNew);
            setValue('isCoinControlEnabled', true);
        }
        composeRequest();
    };

    return {
        allUtxosSelected,
        composedInputs,
        dustUtxos,
        isCoinControlEnabled,
        selectedUtxos,
        spendableUtxos,
        toggleCheckAllUtxos,
        toggleCoinControl,
        toggleUtxoSelection,
    };
};
