import React from 'react';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';

// TODO add possibility to throw testing error from Electron main process

export const ThrowTestingError = () => (
    <SectionItem data-test="@settings/debug/throw-testing-error">
        <TextColumn
            title="Throw testing error"
            description="Throw testing error to debug issues reporting to Sentry"
        />
        <ActionColumn>
            <ActionButton
                variant="danger"
                onClick={() => {
                    throw new Error(`TESTING ERROR ${Date.now()}`);
                }}
            >
                Throw error
            </ActionButton>
        </ActionColumn>
    </SectionItem>
);
