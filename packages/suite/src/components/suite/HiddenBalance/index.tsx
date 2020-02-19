import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';

interface Props {
    stringToHide: string;
}

const Wrapper = styled.div`
    display: flex;
`;

const Dot = styled.div`
    font-weight: bold;
`;

const Symbol = styled.div`
    padding-left: 1ch;
`;

const useHover = () => {
    const [value, setValue] = useState(false);

    const ref = useRef(null);

    const handleMouseOver = () => setValue(true);
    const handleMouseOut = () => setValue(false);

    useEffect(
        () => {
            const node = ref.current;
            if (node) {
                node.addEventListener('mouseover', handleMouseOver);
                node.addEventListener('mouseout', handleMouseOut);

                return () => {
                    node.removeEventListener('mouseover', handleMouseOver);
                    node.removeEventListener('mouseout', handleMouseOut);
                };
            }
        },
        [ref.current], // Recall only if ref changes
    );

    return [ref, value];
};

export default ({ stringToHide, symbol, discreetMode }: Props) => {
    const [hoverRef, isHovered] = useHover();
    const stringLength = stringToHide.length;

    if (!discreetMode)
        return (
            <Wrapper>
                {stringToHide} {symbol}
            </Wrapper>
        );

    return (
        <Wrapper ref={hoverRef}>
            {isHovered && stringToHide}
            {!isHovered && [...Array(stringLength)].map(() => <Dot>•</Dot>)}
            <Symbol>{symbol}</Symbol>
        </Wrapper>
    );
};
