import { selectRouteName } from '@suite/router';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { EarnStakingTable } from './staking/EarnStakingTable';
import { EarnYieldTable } from './yield/EarnYieldTable';

export const EarnDashboard = () => {
    const routeName = useSelector(selectRouteName);
    const isOnEarnPage = routeName === 'suite-earn';

    return (
        <Column gap={48}>
            <EarnStakingTable />
            {isOnEarnPage && <EarnYieldTable />}
        </Column>
    );
};
