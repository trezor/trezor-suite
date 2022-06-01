import React, { useContext } from 'react';
import { Translation as SuiteTranslation } from '@suite/intl';
import { HelperTooltip, HelperTooltipProps } from './HelperTooltip';

export const TranslationModeContext = React.createContext(false);

const CustomHelperTooltip = (props: HelperTooltipProps) => {
    const translationMode = useContext(TranslationModeContext);

    return (
        <HelperTooltip {...props} language="en" translationMode={translationMode}>
            {props.children}
        </HelperTooltip>
    );
};

type TranslationProps = Omit<React.ComponentProps<typeof SuiteTranslation>, 'translationTooltip'>;
const Translation = (props: TranslationProps) => (
    <SuiteTranslation {...props} translationTooltip={CustomHelperTooltip} />
);

export default Translation;
