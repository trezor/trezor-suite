import React from 'react';
import Fees from '@wallet-components/Fees';
import { useRbfContext } from '@wallet-hooks/useRbfForm';

// wrapper for shareable Fees component
const RbfFees = () => {
    const {
        errors,
        register,
        getValues,
        setValue,
        account,
        feeInfo,
        composedLevels,
    } = useRbfContext();
    return (
        <Fees
            errors={errors}
            register={register}
            feeInfo={feeInfo}
            setValue={setValue}
            getValues={getValues}
            account={account}
            composedLevels={composedLevels}
        />
    );
};

export default RbfFees;
