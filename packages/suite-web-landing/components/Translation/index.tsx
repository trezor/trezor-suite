import React, { useContext } from 'react';
import BaseTranslation from '@suite-components/Translation/components/BaseTranslation';
import HelperTooltip, {
    Props as HelperTooltipProps,
} from '@suite-components/Translation/components/HelperTooltip';

export const TranslationModeContext = React.createContext(false);

const CustomHelperTooltip = (props: HelperTooltipProps) => {
    const translationMode = useContext(TranslationModeContext);

    return (
        <HelperTooltip {...props} language="en" translationMode={translationMode}>
            {props.children}
        </HelperTooltip>
    );
};

type TranslationProps = Omit<React.ComponentProps<typeof BaseTranslation>, 'translationTooltip'>;
const Translation = (props: TranslationProps) => {
    return <BaseTranslation {...props} translationTooltip={CustomHelperTooltip} />;
};

export default Translation;
