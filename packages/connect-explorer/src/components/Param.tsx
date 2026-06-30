import React from 'react';
import Markdown from 'react-markdown';

import styled from 'styled-components';

import { Badge } from '@trezor/components';
import { useMDXComponents } from '@trezor/connect-explorer-theme';

interface ParamProps {
    id?: string;
    name: string;
    type: string | React.ReactNode;
    typeLink?: string;
    required?: boolean;
    description?: string;
    children?: React.ReactNode;
}

const ParamWrapper = styled.div`
    margin-top: 0.5rem;
    border-radius: 12px;
    background-image: linear-gradient(
        to bottom,
        ${({ theme }) => theme.legacyBackgroundSurfaceElevation2},
        transparent
    );
`;
const ParamRow = styled.a`
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
    background: ${({ theme }) => theme.surfaceFillRaised};
    border-radius: 12px;
`;
const ParamName = styled.h4`
    font-weight: bold;
    font-family: monospace;
    font-size: 0.875rem;
`;
const ParamType = styled.div<{
    $isLink?: boolean;
}>`
    flex: 1;
    font-size: 0.875rem;

    ${({ $isLink, theme }) =>
        $isLink &&
        `
        color: ${theme.contentBrand};
        text-decoration: underline;
    `}
`;

export const ParamDescriptionComponent = (
    props: Pick<ParamProps, 'description' | 'children' | 'type'>,
) => {
    const components = useMDXComponents();

    return (
        <>
            {props.description && props.type !== 'Undefined' && (
                <ParamDescription>
                    <Markdown components={components as any}>{props.description}</Markdown>
                </ParamDescription>
            )}
            {props.children && <ParamDescription>{props.children}</ParamDescription>}
        </>
    );
};
export const Param = (props: ParamProps) => (
    <ParamWrapper id={props.id}>
        <ParamRow href={props.typeLink}>
            <ParamName>{props.name}</ParamName>
            <ParamType $isLink={!!props.typeLink}>
                {typeof props.type === 'string' ? <Markdown>{props.type}</Markdown> : props.type}
            </ParamType>
            {props.required === true && (
                <Badge cursor="default" intent="brand">
                    Required
                </Badge>
            )}
            {props.required === false && (
                <Badge cursor="default" intent="neutral">
                    Optional
                </Badge>
            )}
        </ParamRow>
        <ParamDescriptionComponent {...props} />
    </ParamWrapper>
);
