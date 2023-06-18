import React from 'react';
import { Banner } from './Banner';
import { setTranslationMode } from 'src/utils/suite/l10n';

const TranslationMode = () => (
    <Banner
        variant="warning"
        body="TRANSLATION MODE IS ON, ALL TEXTS MAY BE INCORRECT"
        action={{
            label: 'Turn off',
            onClick: () => setTranslationMode(false),
            'data-test': '@notification/translation-mode/button',
        }}
    />
);

export default TranslationMode;
