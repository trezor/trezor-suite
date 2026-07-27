import React from 'react';

import { Button } from '@trezor/components';
import { CheckCircleFilledIcon } from '@trezor/icons';

interface TagProps {
    isSelected: boolean;
    onClick: () => void;
    title: string;
}

export const Tag = ({ isSelected, onClick, title }: TagProps) => (
    <Button
        intent="neutral"
        priority="secondary"
        size="small"
        iconLeft={isSelected ? CheckCircleFilledIcon : undefined}
        onClick={onClick}
    >
        {title}
    </Button>
);
