import React from 'react';
import BaseTranslation from '@suite-components/Translation/components/BaseTranslation';

type TranslationProps = Omit<React.ComponentProps<typeof BaseTranslation>, 'translationTooltip'>;
const Translation = (props: TranslationProps) => {
    return (
        <BaseTranslation
            {...props}
            isReactNative
            // dummy tooltip component that just returns the message
            translationTooltip={({ children }) => {
                return children;
            }}
        />
    );
};

export default Translation;
