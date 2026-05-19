import { Table } from '@trezor/components';

import { EarnYieldAccountOpportunity } from './EarnYieldAccountOpportunity';
import { EarnYieldInactiveVaultOpportunity } from './EarnYieldInactiveVaultOpportunity';
import { type YieldAccountOpportunity, type YieldInactiveVaultOpportunity } from './types';

type EarnYieldRowsProps = {
    accountOpportunities: YieldAccountOpportunity[];
    inactiveVaultOpportunities: YieldInactiveVaultOpportunity[];
    isCardLayout: boolean;
};

export const EarnYieldRows = ({
    accountOpportunities,
    inactiveVaultOpportunities,
    isCardLayout,
}: EarnYieldRowsProps) => {
    const rows = (
        <>
            {accountOpportunities.map(opportunity => (
                <EarnYieldAccountOpportunity
                    key={opportunity.key}
                    opportunity={opportunity}
                    isCardLayout={isCardLayout}
                />
            ))}

            {inactiveVaultOpportunities.map(opportunity => (
                <EarnYieldInactiveVaultOpportunity
                    key={opportunity.key}
                    opportunity={opportunity}
                    isCardLayout={isCardLayout}
                />
            ))}
        </>
    );

    if (isCardLayout) return rows;

    return <Table.Body>{rows}</Table.Body>;
};
