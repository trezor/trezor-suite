import React, { useContext } from 'react';
import { BaseTranslation, TranslationProps, messages, MessageId } from '@suite/messages';
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

const Translation = (props: TranslationProps<MessageId>) => (
    <BaseTranslation {...props} messages={messages} translationTooltip={CustomHelperTooltip} />
);

export default Translation;
