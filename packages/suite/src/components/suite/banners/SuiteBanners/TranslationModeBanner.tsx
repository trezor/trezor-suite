import { setTranslationMode } from 'src/utils/suite/l10n';
import { Banner } from '@trezor/components';

export const TranslationMode = () => (
    <Banner
        icon
        variant="warning"
        rightContent={
            <Banner.Button
                onClick={() => setTranslationMode(false)}
                data-testid="@notification/translation-mode/button"
            >
                Turn off
            </Banner.Button>
        }
    >
        TRANSLATION MODE IS ON, ALL TEXTS MAY BE INCORRECT
    </Banner>
);
