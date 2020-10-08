import React from 'react';
import { useSelector } from '@suite-hooks';
import HelperTooltip, { Props } from '../HelperTooltip';

const ConnectedHelperTooltip = (props: Props) => {
    const { language, debugMode } = useSelector(state => ({
        language: state.suite.settings.language,
        debugMode: state.suite.settings.debug.translationMode,
    }));

    return (
        <HelperTooltip {...props} language={language} translationMode={debugMode}>
            {props.children}
        </HelperTooltip>
    );
};

export default ConnectedHelperTooltip;
