import React from 'react';
import styled from 'styled-components';
import Fees from '@wallet-components/Fees';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';

const StyledCard = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: space-between;
    margin: 25px 0;
`;

// wrapper for shareable Fees component
const SellFees = () => {
    const {
        errors,
        register,
        setValue,
        getValues,
        account,
        changeFeeLevel,
        feeInfo,
        composedLevels,
    } = useCoinmarketSellFormContext();

    return (
        <StyledCard>
            <Fees
                errors={errors}
                register={register}
                feeInfo={feeInfo}
                setValue={setValue}
                getValues={getValues}
                account={account}
                composedLevels={composedLevels}
                changeFeeLevel={changeFeeLevel}
                showLabel
            />
        </StyledCard>
    );
};

export default SellFees;
