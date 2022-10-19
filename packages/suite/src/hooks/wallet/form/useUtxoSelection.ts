import { useEffect, useMemo } from 'react';
import { UseFormMethods } from 'react-hook-form';

import { UseSendFormState } from '@suite-common/wallet-types';
import type { AccountUtxo, PROTO } from '@trezor/connect';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';

type Props = UseFormMethods &
    Pick<UseSendFormState, 'account' | 'composedLevels' | 'excludedUtxos' | 'feeInfo'> & {
        composeRequest: (field?: string) => void;
    };

export const useUtxoSelection = ({
    account,
    composedLevels,
    composeRequest,
    excludedUtxos,
    feeInfo,
    register,
    setValue,
    watch,
}: Props) => {
    // register custom form field (without HTMLElement)
    useEffect(() => {
        register({ name: 'isCoinControlEnabled', type: 'custom' });
        register({ name: 'selectedUtxos', type: 'custom' });
        register({ name: 'anonymityWarningChecked', type: 'custom' });
    }, [register]);

    // has coin control been enabled manually?
    const isCoinControlEnabled = watch('isCoinControlEnabled');
    // fee level
    const selectedFee = watch('selectedFee');
    // confirmation of spending low-anonymity UTXOs - only relevant for coinjoin account
    const anonymityWarningChecked = watch('anonymityWarningChecked');
    // manually selected UTXOs
    const selectedUtxos: AccountUtxo[] = watch('selectedUtxos') || [];

    // is the UTXO manually selected?
    const isSelected = (utxo: AccountUtxo) =>
        selectedUtxos.some(selected => selected.txid === utxo.txid && selected.vout === utxo.vout);

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
    const allUtxosSelected = !!selectedUtxos.length && spendableUtxos.every(isSelected);
    // transaction composed for the fee level chosen by the user
    const composedLevel = composedLevels?.[selectedFee || 'normal'];

    // inputs to be used in the transactions
    const composedInputs = useMemo(
        () =>
            composedLevel && 'transaction' in composedLevel ? composedLevel.transaction.inputs : [],
        [composedLevel],
    ) as PROTO.TxInputType[];

    // UTXOs corresponding to the inputs
    // it is a different object type, but some properties are shared between the two
    const preselectedUtxos = useMemo(
        () =>
            account.utxo?.filter(utxo =>
                composedInputs.some(
                    input => input.prev_hash === utxo.txid && input.prev_index === utxo.vout,
                ),
            ) || [],
        [account.utxo, composedInputs],
    );

    // at least one of the selected UTXOs does not comply to targe anonymity
    const isLowAnonymityUtxoSelected =
        account.accountType === 'coinjoin' &&
        selectedUtxos.some(
            selectedUtxo => excludedUtxos[getUtxoOutpoint(selectedUtxo)] === 'low-anonymity',
        );

    // uncheck the confirmation checkbox whenever it is hidden
    if (!isLowAnonymityUtxoSelected && anonymityWarningChecked) {
        setValue('anonymityWarningChecked', false);
    }

    const toggleAnonymityWarning = () =>
        setValue('anonymityWarningChecked', !anonymityWarningChecked);

    // uncheck all UTXOs or check all spendable UTXOs and enable coin control
    const toggleCheckAllUtxos = () => {
        if (allUtxosSelected) {
            setValue('selectedUtxos', []);
        } else {
            setValue('selectedUtxos', [...dustUtxos.filter(isSelected), ...spendableUtxos]);
            setValue('isCoinControlEnabled', true);
        }
        composeRequest();
    };

    // enable coin control or disable it and reset selected UTXOs
    const toggleCoinControl = () => {
        setValue('isCoinControlEnabled', !isCoinControlEnabled);
        setValue('selectedUtxos', isCoinControlEnabled ? [] : preselectedUtxos);
        composeRequest();
    };

    // uncheck a UTXO or check it and enable coin control
    const toggleUtxoSelection = (utxo: AccountUtxo) => {
        const isSameUtxo = (u: AccountUtxo) => u.txid === utxo.txid && u.vout === utxo.vout;

        const alreadySelectedUtxo = selectedUtxos.find(isSameUtxo);
        if (alreadySelectedUtxo) {
            // uncheck the UTXO if already selected
            setValue(
                'selectedUtxos',
                selectedUtxos.filter(u => u !== alreadySelectedUtxo),
            );
        } else {
            // check the UTXO
            // however, in case the coin control has not been enabled and the UTXO has been preselected, do not check it
            const selectedUtxosOld = !isCoinControlEnabled ? preselectedUtxos : selectedUtxos;
            const selectedUtxosNew = preselectedUtxos.some(isSameUtxo)
                ? preselectedUtxos
                : [...selectedUtxosOld, utxo];

            setValue('selectedUtxos', selectedUtxosNew);
            setValue('isCoinControlEnabled', true);
        }
        composeRequest();
    };

    return {
        allUtxosSelected,
        anonymityWarningChecked,
        composedInputs,
        dustUtxos,
        isCoinControlEnabled,
        isLowAnonymityUtxoSelected,
        selectedUtxos,
        spendableUtxos,
        toggleAnonymityWarning,
        toggleCheckAllUtxos,
        toggleCoinControl,
        toggleUtxoSelection,
    };
};
