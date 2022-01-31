import React from 'react';

import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { isTranslationMode, setTranslationMode } from '@suite-utils/l10n';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

export const TranslationMode = () => {
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.TranslationMode);

    return (
        <SectionItem
            data-test="@settings/debug/translation-mode"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
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
};
