import React from 'react';

import { Button } from '@trezor/components';

interface AddEntryButtonProps {
    onClick: () => void;
}

export const AddEntryButton = ({ onClick }: AddEntryButtonProps) => (
    <Button variant="tertiary" size="small" icon="PLUS" onClick={onClick}>
        Add Entry
    </Button>
);
