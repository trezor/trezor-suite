import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

// TODO add possibility to throw testing error from Electron main process

export const ThrowTestingError = () => (
    <SectionItem data-testid="@settings/debug/throw-testing-error">
        <TextColumn
            title="Throw testing error"
            description="Throw testing error to debug issues reporting to Sentry"
        />
        <ActionColumn>
            <ActionButton
                intent="critical"
                onClick={() => {
                    throw new Error(`TESTING ERROR ${Date.now()}`);
                }}
            >
                Throw error
            </ActionButton>
        </ActionColumn>
    </SectionItem>
);
