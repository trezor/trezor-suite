import React from 'react';
import styled from 'styled-components';

const DIMENSIONS = 44;

const Circle = styled.div`
    border: 1.2px solid;
    height: ${DIMENSIONS}px;
    width: ${DIMENSIONS}px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.82rem;
`;

interface NumberProps {
    number: number;
}

const Number = (props: NumberProps) => {
    return <Circle>{props.number}</Circle>;
};

interface NumbersProps {
    length: number;
}

const Wrapper = styled.div<{ length: number }>`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: ${({ length }) => `${length * DIMENSIONS * 1.2}px`};
`;

export default (props: NumbersProps) => {
    return (
        <Wrapper length={props.length}>
            {Array.from(new Array(props.length)).map((_item: number, index: number) => (
                // eslint-disable-next-line react/no-array-index-key
                <Number number={index + 1} key={index} />
            ))}
        </Wrapper>
    );
};
