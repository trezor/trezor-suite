import React from 'react';
import BaseTranslation from './components/BaseTranslation';
import { Props } from './components/HelperTooltip';

// TODO: could be removed after old translation mode is upgraded in landing page as well
const HelperTooltipDummy = ({ children }: Props) => children;

const Translation = (
    props: Omit<React.ComponentProps<typeof BaseTranslation>, 'translationTooltip'>,
) => <BaseTranslation {...props} translationTooltip={HelperTooltipDummy} />;

export { Translation };
