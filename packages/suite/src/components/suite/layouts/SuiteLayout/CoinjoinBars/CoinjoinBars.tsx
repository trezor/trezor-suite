import { useMemo } from 'react';

import { selectCoinjoinAccounts } from '@suite/coinjoin';

import { CoinjoinStatusBar } from './CoinjoinStatusBar';
import { useSelector } from '../../../../../hooks/suite';

export const CoinjoinBars = () => {
    const coinjoinAccounts = useSelector(selectCoinjoinAccounts);

    const sessionCount = coinjoinAccounts.filter(account => account.session).length;

    const coinjoinStatusBars = useMemo(
        () =>
            coinjoinAccounts?.map(({ key, session }) => {
                if (!session) {
                    return;
                }

                return (
                    <CoinjoinStatusBar
                        accountKey={key}
                        session={session}
                        isSingle={sessionCount === 1}
                        key={key}
                    />
                );
            }),
        [coinjoinAccounts, sessionCount],
    );

    return <>{coinjoinStatusBars}</>;
};
