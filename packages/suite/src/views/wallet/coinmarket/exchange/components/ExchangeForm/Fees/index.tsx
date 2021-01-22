import React from 'react';
import styled from 'styled-components';
import Fees from '@wallet-components/Fees';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { PrecomposedLevels } from '@wallet-types/sendForm';

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
        setValue,
        getValues,
        account,
        changeFeeLevel,
        feeInfo,
        transactionInfo,
    } = useCoinmarketExchangeFormContext();

    // workaround
    // exchange hook does not provide whole PrecomposedLevels object
    // build it from transactionInfo
    let composedLevels: PrecomposedLevels | undefined;
    if (transactionInfo) {
        const selectedFee = getValues('selectedFee');
        composedLevels = {};
        composedLevels[selectedFee] = transactionInfo;
    }

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

export default ExchangeFees;
