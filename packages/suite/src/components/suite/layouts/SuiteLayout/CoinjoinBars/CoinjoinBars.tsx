import { useMemo } from 'react';

import { selectCoinjoinAccounts } from '@suite/coinjoin';

import { useSelector } from 'src/hooks/suite';

import { CoinjoinStatusBar } from './CoinjoinStatusBar';

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
