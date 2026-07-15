import React from 'react';

import { Button } from '@trezor/components';
import { PlusIcon } from '@trezor/icons';

interface AddEntryButtonProps {
    onClick: () => void;
}

export const AddEntryButton = ({ onClick }: AddEntryButtonProps) => (
    <Button
        intent="neutral"
        priority="secondary"
        size="small"
        iconLeft={PlusIcon}
        onClick={onClick}
    >
        Add Entry
    </Button>
);
