import React from 'react';
import ReactSelect from 'react-select';
import { Props as SelectProps } from 'react-select/lib/Select';
import { OptionProps } from 'react-select/lib/types';
import styles from '../styles';

interface Props extends SelectProps<OptionProps> {
    isSearchable?: boolean;
    withDropdownIndicator?: boolean;
}

const Select = ({ isSearchable = true, withDropdownIndicator = true, ...rest }: Props) => (
    <ReactSelect
        styles={styles(isSearchable, withDropdownIndicator)}
        isSearchable={isSearchable}
        {...rest}
    />
);

export { Select, Props as SelectProps };
