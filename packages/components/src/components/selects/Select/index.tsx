import PropTypes from 'prop-types';
import React from 'react';
import ReactSelect from 'react-select';
import { Props as SelectProps } from 'react-select/lib/Select';
import { OptionProps } from 'react-select/lib/types';
import styled, { css } from 'styled-components';
import styles from '../styles';
import colors from '../../../config/colors';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const TopLabel = styled.span`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

interface Props extends SelectProps<OptionProps> {
    isSearchable?: boolean;
    withDropdownIndicator?: boolean;
    topLabel: React.ReactNode;
    wrapperProps?: Record<string, any>;
}

const Select = ({
    isSearchable = true,
    withDropdownIndicator = true,
    className,
    wrapperProps,
    topLabel,
    ...rest
}: Props) => {
    return (
        <Wrapper className={className} {...wrapperProps}>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <ReactSelect
                styles={styles(isSearchable, withDropdownIndicator)}
                isSearchable={isSearchable}
                {...rest}
            />
        </Wrapper>
    );
};

Select.propTypes = {
    isAsync: PropTypes.bool,
    isSearchable: PropTypes.bool,
    withDropdownIndicator: PropTypes.bool,
    // TODO
    // eslint-disable-next-line react/forbid-prop-types
    options: PropTypes.array,
    topLabel: PropTypes.node,
    // TODO
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.object,
    onChange: PropTypes.func,
};

export { Select, Props as SelectProps };
