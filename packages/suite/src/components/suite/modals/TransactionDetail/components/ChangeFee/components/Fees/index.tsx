import React from 'react';
import { Fees } from '@wallet-components/Fees';
import { useRbfContext } from '@wallet-hooks/useRbfForm';

// wrapper for shareable Fees component
const RbfFees = () => {
    const {
        errors,
        register,
        control,
        setValue,
        getValues,
        changeFeeLevel,
        account,
        feeInfo,
        composedLevels,
    } = useRbfContext();

    return (
        <Fees
            control={control}
            errors={errors}
            register={register}
            feeInfo={feeInfo}
            setValue={setValue}
            getValues={getValues}
            account={account}
            composedLevels={composedLevels}
            changeFeeLevel={changeFeeLevel}
            label="TR_NEW_FEE"
            rbfForm
        />
    );
};

export default RbfFees;
