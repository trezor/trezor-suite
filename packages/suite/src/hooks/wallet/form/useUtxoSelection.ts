import { useEffect, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';

import {
    UseSendFormState,
    ExcludedUtxos,
    UtxoSelectionContext,
    SendContextValues,
    FormState,
} from '@suite-common/wallet-types';
import type { AccountUtxo, PROTO } from '@trezor/connect';
import { getUtxoOutpoint, isSameUtxo } from '@suite-common/wallet-utils';
import { useCoinjoinRegisteredUtxos } from './useCoinjoinRegisteredUtxos';

interface UtxoSelectionContextProps
    extends UseFormReturn<FormState>,
        Pick<UseSendFormState, 'account' | 'composedLevels'> {
    excludedUtxos: ExcludedUtxos;
    composeRequest: SendContextValues['composeTransaction'];
}

export const useUtxoSelection = ({
    account,
    composedLevels,
    composeRequest,
    excludedUtxos,
    register,
    setValue,
    watch,
}: UtxoSelectionContextProps): UtxoSelectionContext => {
    // register custom form field (without HTMLElement)
    useEffect(() => {
        register('isCoinControlEnabled');
        register('selectedUtxos');
        register('anonymityWarningChecked');
    }, [register]);

    const coinjoinRegisteredUtxos = useCoinjoinRegisteredUtxos({ account });

    // has coin control been enabled manually?
    const isCoinControlEnabled = watch('isCoinControlEnabled');
    // fee level
    const selectedFee = watch('selectedFee');
    // confirmation of spending low-anonymity UTXOs - only relevant for coinjoin account
    const anonymityWarningChecked = !!watch('anonymityWarningChecked');
    // manually selected UTXOs
    const selectedUtxos = watch('selectedUtxos', []);

    // watch changes of account utxos AND utxos registered in coinjoin Round,
    // exclude spent/registered utxos from the subset of selectedUtxos
    useEffect(() => {
        if (isCoinControlEnabled && selectedUtxos.length > 0) {
            const spentUtxos = selectedUtxos.filter(
                selected => !account.utxo?.some(utxo => isSameUtxo(selected, utxo)),
            );
            const registeredUtxos = selectedUtxos.filter(selected =>
                coinjoinRegisteredUtxos.some(utxo => isSameUtxo(selected, utxo)),
            );

            if (spentUtxos.length > 0 || registeredUtxos.length > 0) {
                setValue(
                    'selectedUtxos',
                    selectedUtxos.filter(
                        u => !spentUtxos.includes(u) && !registeredUtxos.includes(u),
                    ),
                );
                composeRequest();
            }
        }
    }, [
        isCoinControlEnabled,
        selectedUtxos,
        account.utxo,
        coinjoinRegisteredUtxos,
        setValue,
        composeRequest,
    ]);

    const spendableUtxos: AccountUtxo[] = [];
    const lowAnonymityUtxos: AccountUtxo[] = [];
    const dustUtxos: AccountUtxo[] = [];
    account?.utxo?.forEach(utxo => {
        switch (excludedUtxos[getUtxoOutpoint(utxo)]) {
            case 'low-anonymity':
                lowAnonymityUtxos.push(utxo);
                return;
            case 'dust':
                dustUtxos.push(utxo);
                return;
            default:
                spendableUtxos.push(utxo);
        }
    });

    // category displayed on top and controlled by the check-all checkbox
    const topCategory =
        [spendableUtxos, lowAnonymityUtxos, dustUtxos].find(utxoCategory => utxoCategory.length) ||
        [];

    // is there at least one UTXO and are all UTXOs in the top category selected?
    const allUtxosSelected =
        !!topCategory.length &&
        !!topCategory?.every((utxo: AccountUtxo) =>
            selectedUtxos.some(selected => isSameUtxo(selected, utxo)),
        );

    // transaction composed for the fee level chosen by the user
    const composedLevel = composedLevels?.[selectedFee || 'normal'];

    // inputs to be used in the transactions
    const composedInputs = useMemo(
        () => (composedLevel && 'inputs' in composedLevel ? composedLevel.inputs : []),
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

    // at least one of the selected UTXOs does not comply to target anonymity
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
            // check top category and keep any already checked UTXOs from other categories
            const selectedUtxosFromLowerCategories = selectedUtxos.filter(
                selected => !topCategory?.find(utxo => isSameUtxo(selected, utxo)),
            );
            setValue(
                'selectedUtxos',
                topCategory
                    .concat(selectedUtxosFromLowerCategories)
                    .filter(utxo => !coinjoinRegisteredUtxos.includes(utxo)),
            );
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
        const alreadySelectedUtxo = selectedUtxos.find(selected => isSameUtxo(selected, utxo));
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
            const selectedUtxosNew = preselectedUtxos.some(selected => isSameUtxo(selected, utxo))
                ? preselectedUtxos
                : [...selectedUtxosOld, utxo];

            setValue('selectedUtxos', selectedUtxosNew);
            setValue('isCoinControlEnabled', true);
        }
        composeRequest();
    };

    return {
        excludedUtxos,
        allUtxosSelected,
        anonymityWarningChecked,
        composedInputs,
        dustUtxos,
        isCoinControlEnabled,
        isLowAnonymityUtxoSelected,
        lowAnonymityUtxos,
        selectedUtxos,
        spendableUtxos,
        coinjoinRegisteredUtxos,
        toggleAnonymityWarning,
        toggleCheckAllUtxos,
        toggleCoinControl,
        toggleUtxoSelection,
    };
};
