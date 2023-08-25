import React from 'react';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';

// TODO add possibility to throw testing error from Electron main process

export const ThrowTestingError = () => (
    <SectionItem data-test="@settings/debug/throw-testing-error">
        <TextColumn
            title="Throw testing error"
            description="Throw testing error to debug issues reporting to Sentry"
        />
        <ActionColumn>
            <ActionButton
                variant="destructive"
                onClick={() => {
                    throw new Error(`TESTING ERROR ${Date.now()}`);
                }}
            >
                Throw error
            </ActionButton>
        </ActionColumn>
    </SectionItem>
);
