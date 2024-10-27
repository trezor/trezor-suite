import { useEffect, useMemo, useState } from 'react';
import { getNonAsciiChars } from '@trezor/utils';

export const useNonAsciiChars = (value: string) => {
    const [showAsciiBanner, setShowAsciiBanner] = useState(false);

    const nonAsciiChars = useMemo(() => getNonAsciiChars(value), [value]);

    useEffect(() => {
        if (nonAsciiChars !== null) {
            // If the banner was displayed once, we don't hide it again
            setShowAsciiBanner(true);
        }
    }, [nonAsciiChars]);

    return { nonAsciiChars, showAsciiBanner };
};
