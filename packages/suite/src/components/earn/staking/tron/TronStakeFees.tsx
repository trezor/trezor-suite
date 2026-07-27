import { Card, Column } from '@trezor/components';

import { Fees } from 'src/components/wallet/Fees/Fees';

import { useTronStakeContext } from './TronStakeContext';
import { useTronStakeFees } from './hooks/useTronStakeFees';

export const TronStakeFees = () => {
    const { account } = useTronStakeContext();
    const { feeInfo, composedLevels } = useTronStakeFees();

    return (
        <Card paddingType="none">
            <Column padding={{ vertical: 16, horizontal: 20 }}>
                <Fees
                    account={account}
                    feeInfo={feeInfo}
                    composedLevels={composedLevels}
                    changeFeeLevel={() => {}}
                />
            </Column>
        </Card>
    );
};
