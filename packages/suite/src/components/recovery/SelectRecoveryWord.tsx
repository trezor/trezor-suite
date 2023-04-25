import React from 'react';
import { useRecovery } from '@suite-hooks';
import { WordInput, WordInputAdvanced } from '@suite-components';

export const SelectRecoveryWord = () => {
    const { wordRequestInputType } = useRecovery();

    if (wordRequestInputType === 6 || wordRequestInputType === 9) {
        return <WordInputAdvanced count={wordRequestInputType} />;
    }

    if (wordRequestInputType === 'plain') {
        return <WordInput />;
    }

    return null;
};
