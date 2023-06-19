import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

import { Card } from 'src/components/suite';
import { Fees } from 'src/components/wallet/Fees';
import { useSendFormContext } from 'src/hooks/wallet';

const StyledCard = styled(Card)`
    display: flex;
    margin-bottom: 8px;
    padding: 32px 42px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 32px 20px;
    }
`;

// wrapper for shareable Fees component
export const SendFees = () => {
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
    } = useSendFormContext();

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
