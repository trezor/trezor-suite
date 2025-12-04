import { useState } from 'react';
import { useThrottle } from 'react-use';

export function useSearchFilter() {
    const [search, setSearch] = useState('');
    const throttledSearch = useThrottle(search, 250);

    return {
        search,
        throttledSearch,
        setSearch,
    };
}
