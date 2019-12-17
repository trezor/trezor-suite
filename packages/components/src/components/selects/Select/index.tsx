import React from 'react';
import ReactSelect from 'react-select';
import styled from 'styled-components';
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

interface Props {
    isSearchable?: boolean;
    withDropdownIndicator?: boolean;
    topLabel?: React.ReactNode;
    wrapperProps?: Record<string, any>;
}

const Select = ({
    isSearchable = true,
    withDropdownIndicator = true,
    wrapperProps,
    topLabel,
    ...rest
}: Props) => {
    return (
        <Wrapper {...wrapperProps}>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <ReactSelect
                styles={styles(isSearchable, withDropdownIndicator)}
                isSearchable={isSearchable}
                {...rest}
            />
        </Wrapper>
    );
};

export { Select, Props as SelectProps };
