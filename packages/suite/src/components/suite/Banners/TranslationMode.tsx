import React from 'react';
import Wrapper from './components/Wrapper';
import { setTranslationMode } from '@suite-utils/l10n';

const TranslationMode = () => (
    <Wrapper
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
