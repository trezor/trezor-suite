import { getNetwork } from '@suite-common/wallet-config';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useRbfContext } from 'src/hooks/wallet/useRbfForm';

// wrapper for shareable Fees component
export const RbfFees = () => {
    const {
        formState: { errors, isDirty },
        register,
        control,
        setValue,
        getValues,
        changeFeeLevel,
        account,
        feeInfo,
        composedLevels,
        trigger,
    } = useRbfContext();

    return (
        <Fees
            control={control}
            errors={errors}
            isDirty={isDirty}
            register={register}
            feeInfo={feeInfo}
            setValue={setValue}
            getValues={getValues}
            account={account}
            composedLevels={composedLevels}
            changeFeeLevel={changeFeeLevel}
            label={
                getNetwork(account.symbol).networkType === 'ethereum'
                    ? 'TR_NEW_MAXIMUM_FEE'
                    : 'TR_NEW_FEE'
            }
            rbfForm
            trigger={trigger}
        />
    );
};
