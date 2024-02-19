import { Banner } from '../Banner';
import { setTranslationMode } from 'src/utils/suite/l10n';

export const TranslationMode = () => (
    <Banner
        variant="warning"
        body="TRANSLATION MODE IS ON, ALL TEXTS MAY BE INCORRECT"
        action={{
            label: 'Turn off',
            onClick: () => setTranslationMode(false),
            'data-test-id': '@notification/translation-mode/button',
        }}
    />
);
