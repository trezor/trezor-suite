import styled from 'styled-components';
import React from 'react';
import { FlagType } from '../../support/types';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

export interface FlagProps {
    className?: string;
    country: FlagType;
    size?: number;
}

const Flag = ({ size = 24, country, className }: FlagProps) => (
    <Wrapper>
        <img
            // eslint-disable-next-line global-require, import/no-dynamic-require
            src={require(`../../images/flags/${country.toLowerCase()}.svg`)}
            width={`${size}px`}
            alt={`flag-${country}`}
            className={className}
        />
    </Wrapper>
);

export { Flag };
