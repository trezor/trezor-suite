import { Column } from '@trezor/components';

import { YieldVaultDetailBalanceCard } from './YieldVaultDetailBalanceCard';
import { YieldVaultDetailBanners } from './YieldVaultDetailBanners';
import { YieldVaultDetailInfoCard } from './YieldVaultDetailInfoCard';
import { YieldVaultDetailTransactions } from './YieldVaultDetailTransactions';
import { YieldVaultDetailProvider, type YieldVaultFlowData } from './useYieldVaultDetail';

type YieldVaultDetailContentProps = {
    yieldFlowData: YieldVaultFlowData;
};

export const YieldVaultDetailContent = ({ yieldFlowData }: YieldVaultDetailContentProps) => (
    <YieldVaultDetailProvider yieldFlowData={yieldFlowData}>
        <Column gap={48} alignItems="stretch">
            <Column width="100%" maxWidth={480} gap={16} margin={{ horizontal: 'auto' }}>
                <YieldVaultDetailBanners />
                <YieldVaultDetailBalanceCard />
                <YieldVaultDetailInfoCard />
            </Column>

            <YieldVaultDetailTransactions />
        </Column>
    </YieldVaultDetailProvider>
);
