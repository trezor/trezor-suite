import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useRbfContext } from 'src/hooks/wallet/useRbfForm';

// wrapper for shareable Fees component
export const RbfFees = () => {
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
    const { changeFeeLevel, account, feeInfo, composedLevels } = useRbfContext();

    return (
        <Fees
            feeInfo={feeInfo}
            account={account}
            composedLevels={composedLevels}
            changeFeeLevel={changeFeeLevel}
            label={
                getNetworkConfig(account.symbol).networkType === 'ethereum'
                    ? 'TR_NEW_MAXIMUM_FEE'
                    : 'TR_NEW_FEE'
            }
            rbfForm
        />
    );
};
