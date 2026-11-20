import { useEffect, useState } from 'react';

import { type DebounceOptions, useDebounce } from './useDebounce';

export const useDebouncedValue = <T>(valueToDebounce: T, options?: DebounceOptions): T => {
    const [value, setValue] = useState<T>(valueToDebounce);
    const debounce = useDebounce(options);

    useEffect(() => {
        debounce(() => {
            setValue(valueToDebounce);
        });
    }, [valueToDebounce, debounce]);

    return value;
};
