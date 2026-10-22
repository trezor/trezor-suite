import { Fragment } from 'react';

import styled from 'styled-components';

import { getHighlightParts } from '../utils/highlightText';

const Mark = styled.mark`
    background: yellow;
    color: black;
    font: inherit;
    border-radius: 4px;
`;

type HighlightedTextProps = {
    text: string;
    query: string;
};

export const HighlightedText = ({ text, query }: HighlightedTextProps) => {
    const parts = getHighlightParts(text, query);
    if (parts.every(part => !part.isMatch)) return text;

    return (
        <>
            {parts.map(part =>
                part.isMatch ? (
                    <Mark key={part.key}>{part.text}</Mark>
                ) : (
                    <Fragment key={part.key}>{part.text}</Fragment>
                ),
            )}
        </>
    );
};
