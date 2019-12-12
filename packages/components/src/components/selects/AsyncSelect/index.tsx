import React from 'react';
import Async from 'react-select/async';
import styles from '../styles';

interface Props {
    isSearchable?: boolean;
    withDropdownIndicator?: boolean;
}

interface AsyncProps extends Props {
    loadOptions: (inputValue: string, callback: (options: any) => void) => Promise<any> | void;
}

const AsyncSelect = ({
    isSearchable = true,
    withDropdownIndicator = true,
    loadOptions,
    ...rest
}: AsyncProps) => (
    <Async
        styles={styles(isSearchable, withDropdownIndicator)}
        isSearchable={isSearchable}
        loadOptions={loadOptions}
        {...rest}
    />
);

export { AsyncSelect, AsyncProps as AsyncSelectProps };
