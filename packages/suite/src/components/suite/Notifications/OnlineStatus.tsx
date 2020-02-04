import * as React from 'react';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import Wrapper from './components/Wrapper';

interface Props {
    isOnline: boolean;
}

export default ({ isOnline }: Props) => {
    if (isOnline) return null;
    return (
        <Wrapper variant="info">
            <Translation {...messages.TR_YOU_WERE_DISCONNECTED_DOT} />
        </Wrapper>
    );
};
