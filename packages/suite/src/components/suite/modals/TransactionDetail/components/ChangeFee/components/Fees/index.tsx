import React from 'react';
import Fees from '@wallet-components/Fees';
import { useRbfContext } from '@wallet-hooks/useRbfForm';

// wrapper for shareable Fees component
const RbfFees = () => {
    const {
        errors,
        register,
        getValues,
        changeFeeLevel,
        account,
        feeInfo,
        composedLevels,
    } = useRbfContext();

    return (
        <>
            {/* input needs to be present (react-hook-form errors receiver) */}
            <input type="hidden" name="selectedFee" ref={register()} />
            <Fees
                errors={errors}
                register={register}
                feeInfo={feeInfo}
                getValues={getValues}
                account={account}
                composedLevels={composedLevels}
                changeFeeLevel={changeFeeLevel}
            />
        </>
    );
};

export default RbfFees;
