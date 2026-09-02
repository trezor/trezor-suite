import { Card, Column } from '@trezor/components';

import { Fees } from 'src/components/wallet/Fees/Fees';

import { useTronStakeContext } from './TronStakeContext';

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
