import React from 'react';

import { NewButton } from '@trezor/components';

interface AddEntryButtonProps {
    onClick: () => void;
}

export const AddEntryButton = ({ onClick }: AddEntryButtonProps) => (
    <NewButton intent="neutral" priority="secondary" size="small" iconLeft="plus" onClick={onClick}>
        Add Entry
    </NewButton>
);
