import React from 'react';
import ConnectedHelperTooltip from './components/ConnectedHelperTooltip';
import BaseTranslation from './components/BaseTranslation';

const Translation = (
    props: Omit<React.ComponentProps<typeof BaseTranslation>, 'translationTooltip'>,
) => <BaseTranslation {...props} translationTooltip={ConnectedHelperTooltip} />;

export { Translation };
