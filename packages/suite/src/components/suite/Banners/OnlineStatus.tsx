import * as React from 'react';

import { Translation } from 'src/components/suite';
import { Banner } from './Banner';

interface Props {
    isOnline: boolean;
}

const OnlineStatus = ({ isOnline }: Props) => {
    if (isOnline) return null;

    return <Banner variant="critical" body={<Translation id="TR_YOU_WERE_DISCONNECTED_DOT" />} />;
};

export default OnlineStatus;
