import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import l10nMessages from './NthWord.messages';

const Word = styled.div`
    font-size: 3em;
    white-space: nowrap;
`;

const NthWord = ({ number }: { number: number }) => {
    if (!number) {
        return null;
    }
    return (
        <Word>
            <FormattedMessage {...l10nMessages.TR_NTH_WORD} values={{ number }} />
        </Word>
    );
};

export default NthWord;
