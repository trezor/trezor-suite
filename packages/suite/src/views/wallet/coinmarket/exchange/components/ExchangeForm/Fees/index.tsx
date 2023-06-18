import React from 'react';
import styled from 'styled-components';
import { Fees } from 'src/components/wallet/Fees';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';

const StyledCard = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: space-between;
    margin: 25px 0;
`;

// wrapper for shareable Fees component
const ExchangeFees = () => {
    const {
        errors,
        register,
        control,
        setValue,
        getValues,
        account,
        changeFeeLevel,
        feeInfo,
        composedLevels,
    } = useCoinmarketExchangeFormContext();

    return (
        <StyledCard>
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
                showLabel
            />
        </StyledCard>
    );
};

export default ExchangeFees;
