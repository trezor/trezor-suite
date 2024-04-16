import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn } from 'src/components/suite';
import { isTranslationMode, setTranslationMode } from 'src/utils/suite/l10n';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const TranslationMode = () => {
    return (
        <SettingsSectionItem anchorId={SettingsAnchor.TranslationMode}>
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
        </SettingsSectionItem>
    );
};
