import React from 'react';
import { Banner } from './Banner';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';

export const Coinjoin = () => {
    const coinjoin = useSelector(state => state.wallet.coinjoin);
    const criticalPhase = coinjoin.accounts.find(
        a => typeof a.session?.phase === 'number' && a.session.phase > 0 && a.session.phase < 4,
    );
    if (!criticalPhase) return null;
    return <Banner variant="critical" body={<Translation id="TR_COINJOIN_CRITICAL_PHASE" />} />;
};
