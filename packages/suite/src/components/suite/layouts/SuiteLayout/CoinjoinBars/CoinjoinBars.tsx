import { useMemo } from 'react';

import { useSelector } from 'src/hooks/suite';

import { CoinjoinStatusBar } from './CoinjoinStatusBar';

export const CoinjoinBars = () => {
    const coinjoinAccounts = useSelector(state => state.wallet.coinjoin.accounts);

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
