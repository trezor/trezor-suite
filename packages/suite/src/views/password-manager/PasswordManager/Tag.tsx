import React from 'react';

import { Button } from '@trezor/components';

interface TagProps {
    isSelected: boolean;
    onClick: () => void;
    title: string;
}

export const Tag = ({ isSelected, onClick, title }: TagProps) => (
    <Button
        variant="tertiary"
        size="tiny"
        icon={isSelected ? 'checkActive' : undefined}
        onClick={onClick}
    >
        {title}
    </Button>
);
