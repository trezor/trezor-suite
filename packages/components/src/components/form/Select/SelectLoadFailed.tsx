import { useEffect } from 'react';

import { SelectFallback } from './SelectFallback';
import { type SelectInnerProps } from './types';

/** The disabled control `Select` shows when its react-select part fails to load. */
export const SelectLoadFailed = ({ size, isClean, hasError, onLoadFailed }: SelectInnerProps) => {
    useEffect(() => {
        onLoadFailed();
    }, [onLoadFailed]);

    return <SelectFallback size={size} isClean={isClean} hasError={hasError} isDisabled />;
};
