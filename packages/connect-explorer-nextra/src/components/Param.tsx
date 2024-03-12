import React from 'react';
import Markdown from 'react-markdown';

import styled from 'styled-components';

import { Badge } from '@trezor/components';

interface ParamProps {
    name: string;
    type: string | React.ReactNode;
    required?: boolean;
    description?: string;
    children?: React.ReactNode;
}

const ParamWrapper = styled.div`
    margin-top: 0.5rem;
    border-radius: 12px;
    background-image: linear-gradient(
        to bottom,
        ${({ theme }) => theme.backgroundSurfaceElevation2},
        transparent
    );
`;
const ParamRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0.5rem 1rem;
    gap: 1rem;
`;
const ParamDescription = styled.div`
    margin: 0 0.5rem;
    padding: 0.5rem 1rem;
    background: white;
    border-radius: 12px;
`;
const ParamName = styled.h4`
    font-weight: bold;
    font-family: monospace;
    font-size: 0.875rem;
`;
const ParamType = styled.div`
    flex: 1;
    font-size: 0.875rem;
`;

export const Param = (props: ParamProps) => {
    return (
        <ParamWrapper>
            <ParamRow>
                <ParamName>{props.name}</ParamName>
                <ParamType>
                    {typeof props.type === 'string' ? (
                        <Markdown>{props.type}</Markdown>
                    ) : (
                        props.type
                    )}
                </ParamType>
                {props.required === true && <Badge variant="primary">Required</Badge>}
                {props.required === false && <Badge variant="tertiary">Optional</Badge>}
            </ParamRow>
            {props.description && (
                <ParamDescription>
                    <Markdown>{props.description}</Markdown>
                </ParamDescription>
            )}
            {props.children && <ParamDescription>{props.children}</ParamDescription>}
        </ParamWrapper>
    );
};
