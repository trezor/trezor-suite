import React from 'react';

import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { isTranslationMode, setTranslationMode } from '@suite-utils/l10n';

export const TranslationMode = () => (
    <SectionItem>
        <TextColumn
            title="Translation mode"
            description="Translation mode enables distinctive visual styling for currently used intl messages. Helpful tooltip with an ID of the message will show up when you mouse over the message."
        />
        <ActionColumn>
            <Switch
                checked={isTranslationMode()}
                onChange={() => setTranslationMode(!isTranslationMode())}
            />
        </ActionColumn>
    </SectionItem>
);
