import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type UtxoSorting } from '@suite-common/wallet-types';
import { type Option, Select } from '@trezor/components';

const sortingOptions: { value: UtxoSorting; label: ReactNode }[] = [
    { value: 'newestFirst', label: <Translation id="TR_NEWEST_FIRST" /> },
    { value: 'oldestFirst', label: <Translation id="TR_OLDEST_FIRST" /> },
    { value: 'smallestFirst', label: <Translation id="TR_SMALLEST_FIRST" /> },
    { value: 'largestFirst', label: <Translation id="TR_LARGEST_FIRST" /> },
];

type UtxoSortingSelectProps = {
    selectUtxoSorting: (ordering: UtxoSorting) => void;
    utxoSorting?: UtxoSorting;
};

export const UtxoSortingSelect = ({ selectUtxoSorting, utxoSorting }: UtxoSortingSelectProps) => {
    const selectedOption = sortingOptions.find(option => option.value === utxoSorting);

    const handleChange = ({ value }: Option) => selectUtxoSorting(value);

    return (
        <Select
            data-testid="@coin-control/utxo-sorting-select"
            onChange={handleChange}
            options={sortingOptions}
            size="small"
            value={selectedOption}
            width={240}
        />
    );
};
