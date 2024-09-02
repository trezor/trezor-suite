import React from 'react';
import Markdown from 'react-markdown';

import styled from 'styled-components';

import { Badge, useElevation } from '@trezor/components';
import { useMDXComponents } from '@trezor/connect-explorer-theme';
import { Elevation, mapElevationToBackground } from '@trezor/theme';

interface ParamProps {
    id?: string;
    name: string;
    type: string | React.ReactNode;
    typeLink?: string;
    required?: boolean;
    description?: string;
    children?: React.ReactNode;
}

const ParamWrapper = styled.div<{ $elevation: Elevation }>`
    margin-top: 0.5rem;
    border-radius: 12px;
    background-image: linear-gradient(to bottom, ${mapElevationToBackground}, transparent);
`;
const ParamRow = styled.a`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0.5rem 1rem;
    gap: 1rem;
`;
const ParamDescription = styled.div<{ $elevation: Elevation }>`
    margin: 0 0.5rem;
    padding: 0.5rem 1rem;
    background: ${mapElevationToBackground};
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
        color: ${theme.legacy.TYPE_GREEN};
        text-decoration: underline;
    `}
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const ParamBadge = styled(Badge)`
    cursor: default;
`;

export const ParamDescriptionComponent = (
    props: Pick<ParamProps, 'description' | 'children' | 'type'>,
) => {
    const { parentElevation } = useElevation();
    const components = useMDXComponents();

    return (
        <>
            {props.description && props.type !== 'Undefined' && (
                <ParamDescription $elevation={parentElevation}>
                    <Markdown components={components as any}>{props.description}</Markdown>
                </ParamDescription>
            )}
            {props.children && (
                <ParamDescription $elevation={parentElevation}>{props.children}</ParamDescription>
            )}
        </>
    );
};
export const Param = (props: ParamProps) => {
    const { elevation } = useElevation();

    return (
        <ParamWrapper id={props.id} $elevation={elevation}>
            <ParamRow href={props.typeLink}>
                <ParamName>{props.name}</ParamName>
                <ParamType $isLink={!!props.typeLink}>
                    {typeof props.type === 'string' ? (
                        <Markdown>{props.type}</Markdown>
                    ) : (
                        props.type
                    )}
                </ParamType>
                {props.required === true && <ParamBadge variant="primary">Required</ParamBadge>}
                {props.required === false && <ParamBadge variant="tertiary">Optional</ParamBadge>}
            </ParamRow>
            <ParamDescriptionComponent {...props} />
        </ParamWrapper>
    );
};
