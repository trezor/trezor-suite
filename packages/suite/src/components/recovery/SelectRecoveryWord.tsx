import React from 'react';
import { useRecovery } from '@suite-hooks';
import TrezorConnect, { UI } from '@trezor/connect';
import { WordInput, WordInputAdvanced } from '@suite-components';

export const SelectRecoveryWord = () => {
    const { wordRequestInputType } = useRecovery();

    if (wordRequestInputType === 6 || wordRequestInputType === 9) {
        return (
            <WordInputAdvanced
                count={wordRequestInputType}
                onSubmit={value =>
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value })
                }
            />
        );
    }

    if (wordRequestInputType === 'plain') {
        return (
            <WordInput
                onSubmit={value => {
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: value });
                }}
            />
        );
    }

    return null;
};
