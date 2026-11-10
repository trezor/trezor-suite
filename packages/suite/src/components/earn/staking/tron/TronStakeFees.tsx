import { Card, Column } from '@trezor/components';

import { useTronStakeContext } from './TronStakeContext';
import { Fees } from '../../../wallet/Fees/Fees';

export const TronStakeFees = () => {
    const { account, fees } = useTronStakeContext();
    const { feeInfo, composedLevels } = fees;

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
