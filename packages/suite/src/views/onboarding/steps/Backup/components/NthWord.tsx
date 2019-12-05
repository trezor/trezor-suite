import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import messages from '@suite/support/messages';

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
            <Translation {...messages.TR_NTH_WORD} values={{ number }} />
        </Word>
    );
};

export default NthWord;
