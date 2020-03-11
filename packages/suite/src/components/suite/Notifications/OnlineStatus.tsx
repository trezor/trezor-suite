import * as React from 'react';
import { Translation } from '@suite-components';

import Wrapper from './components/Wrapper';

interface Props {
    isOnline: boolean;
}

export default ({ isOnline }: Props) => {
    if (isOnline) return null;
    return (
        <Wrapper variant="warning">
            <Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />
        </Wrapper>
    );
};
