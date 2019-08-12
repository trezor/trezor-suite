import PropTypes from 'prop-types';
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

Select.propTypes = {
    isAsync: PropTypes.bool,
    isSearchable: PropTypes.bool,
    withDropdownIndicator: PropTypes.bool,
    // TODO
    // eslint-disable-next-line react/forbid-prop-types
    options: PropTypes.array,
    // TODO
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.object,
    onChange: PropTypes.func,
};

export { Select, Props as SelectProps };
