import React from 'react';
import styled from 'styled-components';

interface Props {
    value: number;
}

const Value = styled.span``;

const Delta = ({ value }: Props) => (
    <Value>{`${value < 0 ? '-' : '+'}${Number(value).toFixed(2)}%`}</Value>
);

export default Delta;
