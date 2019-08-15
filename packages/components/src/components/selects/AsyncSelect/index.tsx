import PropTypes from 'prop-types';
import React from 'react';
import Async from 'react-select/async';
import { OptionProps } from 'react-select/lib/types';
import { Props as SelectProps } from 'react-select/lib/Select';
import styles from '../styles';

interface Props extends SelectProps<OptionProps> {
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

AsyncSelect.propTypes = {
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

export { AsyncSelect, AsyncProps as AsyncSelectProps };
