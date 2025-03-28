import { useEffect, useState } from 'react';

import { useDebounce } from './useDebounce';

export const useDebouncedValue = <T>(valueToDebounce: T): T => {
    const [value, setValue] = useState<T>(valueToDebounce);
    const debounce = useDebounce();

    useEffect(() => {
        debounce(() => {
            setValue(valueToDebounce);
        });
    }, [valueToDebounce, debounce]);

    return value;
};
