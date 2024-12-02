import { ReactNode } from 'react';

import { UtxoSorting } from '@suite-common/wallet-types';
import { Option, Select } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';

const sortingOptions: { value: UtxoSorting; label: ReactNode }[] = [
    { value: 'newestFirst', label: <Translation id="TR_NEWEST_FIRST" /> },
    { value: 'oldestFirst', label: <Translation id="TR_OLDEST_FIRST" /> },
    { value: 'smallestFirst', label: <Translation id="TR_SMALLEST_FIRST" /> },
    { value: 'largestFirst', label: <Translation id="TR_LARGEST_FIRST" /> },
];

export const UtxoSortingSelect = () => {
    const {
        utxoSelection: { utxoSorting, selectUtxoSorting },
    } = useSendFormContext();

    const selectedOption = sortingOptions.find(option => option.value === utxoSorting);

    const handleChange = ({ value }: Option) => selectUtxoSorting(value);

    return (
        <Select
            options={sortingOptions}
            value={selectedOption}
            onChange={handleChange}
            size="small"
            width={240}
            data-testid="@coin-control/utxo-sorting-select"
        />
    );
};
