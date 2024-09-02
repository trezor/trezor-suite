import React from 'react';
import { IconButton, IconButtonProps, Tooltip } from '@trezor/components';
import { borders } from '@trezor/theme';
import styled from 'styled-components';

interface ActionButtonProps extends IconButtonProps {
    title: string;
    className?: string;
}

// eslint-disable-next-line local-rules/no-override-ds-component
export const Button = styled(IconButton)`
    border-radius: ${borders.radii.sm};
`;

export const ActionButton = ({ className, title, ...props }: ActionButtonProps) => (
    <Tooltip content={title} cursor="pointer">
        <Button className={className} width="100%" {...props} />
    </Tooltip>
);
