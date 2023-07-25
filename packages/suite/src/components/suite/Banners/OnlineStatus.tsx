import * as React from 'react';

import { Translation } from 'src/components/suite';
import { Banner } from './Banner';

interface OnlineStatusProps {
    isOnline: boolean;
}

const OnlineStatus = ({ isOnline }: OnlineStatusProps) => {
    if (isOnline) return null;

    return <Banner variant="critical" body={<Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />} />;
};

export default OnlineStatus;
