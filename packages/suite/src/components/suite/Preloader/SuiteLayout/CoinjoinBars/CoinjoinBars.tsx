import { useMemo } from 'react';
import { CoinjoinStatusBar } from './CoinjoinStatusBar';
import { useSelector } from 'src/hooks/suite';

export const CoinjoinBars = () => {
    const coinjoinAccounts = useSelector(state => state.wallet.coinjoin.accounts);

    let sessionCount = 0;
    coinjoinAccounts.forEach(({ session }) => {
        if (session) {
            sessionCount++;
        }
    });

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
