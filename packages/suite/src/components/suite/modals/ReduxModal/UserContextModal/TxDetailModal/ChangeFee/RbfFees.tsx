import { getNetwork } from '@suite-common/wallet-config';

import { useRbfContext } from '../../../../../../../hooks/wallet/useRbfForm';
import { Fees } from '../../../../../../wallet/Fees/Fees';

// wrapper for shareable Fees component
export const RbfFees = () => {
    const { changeFeeLevel, account, feeInfo, composedLevels } = useRbfContext();

    return (
        <Fees
            feeInfo={feeInfo}
            account={account}
            composedLevels={composedLevels}
            changeFeeLevel={changeFeeLevel}
            label={
                getNetwork(account.symbol).networkType === 'ethereum'
                    ? 'TR_NEW_MAXIMUM_FEE'
                    : 'TR_NEW_FEE'
            }
            rbfForm
        />
    );
};
