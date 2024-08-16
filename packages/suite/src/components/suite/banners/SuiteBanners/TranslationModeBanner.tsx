import { setTranslationMode } from 'src/utils/suite/l10n';
import { Warning } from '@trezor/components';

export const TranslationMode = () => (
    <Warning
        icon
        variant="warning"
        rightContent={
            <Warning.Button
                onClick={() => setTranslationMode(false)}
                data-testid="@notification/translation-mode/button"
            >
                Turn off
            </Warning.Button>
        }
    >
        TRANSLATION MODE IS ON, ALL TEXTS MAY BE INCORRECT
    </Warning>
);
