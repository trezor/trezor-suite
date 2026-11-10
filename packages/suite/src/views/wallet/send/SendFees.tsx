import { Card } from '@trezor/components';

import { Fees } from '../../../components/wallet/Fees/Fees';
import { useSendFormContext } from '../../../hooks/wallet';

export const SendFees = () => {
    const { changeFeeLevel, account, feeInfo, composedLevels } = useSendFormContext();

    return (
        <Card>
            <Fees
                feeInfo={feeInfo}
                account={account}
                composedLevels={composedLevels}
                changeFeeLevel={changeFeeLevel}
            />
        </Card>
    );
};
