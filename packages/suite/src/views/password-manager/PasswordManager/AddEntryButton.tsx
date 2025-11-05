import React from 'react';

import { Button } from '@trezor/components';

interface AddEntryButtonProps {
    onClick: () => void;
}

export const AddEntryButton = ({ onClick }: AddEntryButtonProps) => (
    <Button intent="neutral" priority="secondary" size="small" iconLeft="plus" onClick={onClick}>
        Add Entry
    </Button>
);
