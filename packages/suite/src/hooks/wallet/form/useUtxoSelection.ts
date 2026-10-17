import { useEffect, useMemo } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { selectAccountTransactionsWithNulls } from '@suite-common/wallet-core';
import { type ExcludedUtxos, type FormState, type UtxoSorting } from '@suite-common/wallet-types';
import { getUtxoOutpoint, isSameUtxo } from '@suite-common/wallet-utils';
import type { AccountUtxo, PROTO } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';
import {
    type SendContextValues,
    type UseSendFormState,
    type UtxoSelectionContext,
} from 'src/types/wallet/sendForm';
import { sortUtxos } from 'src/utils/wallet/utxoSortingUtils';

import { useCoinjoinRegisteredUtxos } from './useCoinjoinRegisteredUtxos';

interface UtxoSelectionContextProps
    extends UseFormReturn<FormState>, Pick<UseSendFormState, 'account' | 'composedLevels'> {
    excludedUtxos: ExcludedUtxos;
    composeRequest: SendContextValues['composeTransaction'];
}

// Composed inputs are PROTO.TxInputType rather than AccountUtxo, so they are matched on a plain
// `txid:vout` key instead of getUtxoOutpoint, which throws on anything but a 64-character hash.
const getTxidVoutKey = (txid: string, vout: number) => `${txid}:${vout}`;

export const useUtxoSelection = ({
    account,
    composedLevels,
    composeRequest,
    excludedUtxos,
    register,
    setValue,
    watch,
}: UtxoSelectionContextProps): UtxoSelectionContext => {
    const accountTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, account.key),
    );

    // register custom form field (without HTMLElement)
    useEffect(() => {
        register('isCoinControlEnabled');
        register('selectedUtxos');
        register('anonymityWarningChecked');
        register('utxoSorting');
    }, [register]);

    const coinjoinRegisteredUtxos = useCoinjoinRegisteredUtxos({ account });

    const [isCoinControlEnabled, options, selectedFee, utxoSorting] = watch([
        'isCoinControlEnabled',
        'options',
        'selectedFee',
        'utxoSorting',
    ]);
    // confirmation of spending low-anonymity UTXOs - only relevant for coinjoin account
    const anonymityWarningChecked = !!watch('anonymityWarningChecked');
    // manually selected UTXOs
    const selectedUtxos = watch('selectedUtxos', []);

    const accountUtxoOutpoints = useMemo(
        () => new Set((account.utxo ?? []).map(getUtxoOutpoint)),
        [account.utxo],
    );
    const coinjoinRegisteredOutpoints = useMemo(
        () => new Set(coinjoinRegisteredUtxos.map(getUtxoOutpoint)),
        [coinjoinRegisteredUtxos],
    );

    // watch changes of account utxos AND utxos registered in coinjoin Round,
    // exclude spent/registered utxos from the subset of selectedUtxos
    useEffect(() => {
        if (isCoinControlEnabled && selectedUtxos.length > 0) {
            const remainingUtxos = selectedUtxos.filter(selected => {
                const outpoint = getUtxoOutpoint(selected);
                const isSpent = !accountUtxoOutpoints.has(outpoint);
                const isRegistered = coinjoinRegisteredOutpoints.has(outpoint);

                return !isSpent && !isRegistered;
            });

            if (remainingUtxos.length !== selectedUtxos.length) {
                setValue('selectedUtxos', remainingUtxos);
                composeRequest();
            }
        }
    }, [
        isCoinControlEnabled,
        selectedUtxos,
        accountUtxoOutpoints,
        coinjoinRegisteredOutpoints,
        setValue,
        composeRequest,
    ]);

    const spendableUtxos: AccountUtxo[] = [];
    const lowAnonymityUtxos: AccountUtxo[] = [];
    const dustUtxos: AccountUtxo[] = [];

    // Skip sorting and categorizing UTXOs if coin control is not enabled.
    const utxos =
        options?.includes('utxoSelection') && account?.utxo
            ? sortUtxos(account?.utxo, utxoSorting, accountTransactions)
            : account?.utxo;

    if (utxos?.length) {
        utxos?.forEach(utxo => {
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
    }

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

    const composedInputKeys = useMemo(
        () =>
            new Set(composedInputs.map(input => getTxidVoutKey(input.prev_hash, input.prev_index))),
        [composedInputs],
    );

    // UTXOs corresponding to the inputs
    // it is a different object type, but some properties are shared between the two
    const preselectedUtxos = useMemo(
        () =>
            account.utxo?.filter(utxo =>
                composedInputKeys.has(getTxidVoutKey(utxo.txid, utxo.vout)),
            ) || [],
        [account.utxo, composedInputKeys],
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

    const selectUtxoSorting = (sorting: UtxoSorting) => setValue('utxoSorting', sorting);

    const toggleAnonymityWarning = () =>
        setValue('anonymityWarningChecked', !anonymityWarningChecked);

    // uncheck all UTXOs or check all spendable UTXOs and enable coin control
    const toggleCheckAllUtxos = () => {
        if (allUtxosSelected) {
            setValue('selectedUtxos', []);
        } else {
            const topCategoryOutpoints = new Set(topCategory.map(getUtxoOutpoint));

            // check top category and keep any already checked UTXOs from other categories
            const selectedUtxosFromLowerCategories = selectedUtxos.filter(
                selected => !topCategoryOutpoints.has(getUtxoOutpoint(selected)),
            );
            setValue(
                'selectedUtxos',
                topCategory
                    .concat(selectedUtxosFromLowerCategories)
                    .filter(utxo => !coinjoinRegisteredOutpoints.has(getUtxoOutpoint(utxo))),
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
        utxoSorting,
        selectUtxoSorting,
        toggleAnonymityWarning,
        toggleCheckAllUtxos,
        toggleCoinControl,
        toggleUtxoSelection,
    };
};
