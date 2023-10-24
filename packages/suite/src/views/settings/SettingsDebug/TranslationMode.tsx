import { Switch } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { isTranslationMode, setTranslationMode } from 'src/utils/suite/l10n';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

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
                    isChecked={isTranslationMode()}
                    onChange={() => setTranslationMode(!isTranslationMode())}
                />
            </ActionColumn>
        </SectionItem>
    );
};
