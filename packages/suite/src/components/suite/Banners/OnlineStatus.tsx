import * as React from 'react';

import { Translation } from '@suite-components';
import Wrapper from './components/Wrapper';

interface Props {
    isOnline: boolean;
}

const OnlineStatus = ({ isOnline }: Props) => {
    if (isOnline) return null;

    return <Wrapper variant="critical" body={<Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />} />;
};

export default OnlineStatus;
