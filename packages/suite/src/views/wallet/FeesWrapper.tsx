import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

import { Card } from '@suite-components';
import { Fees } from '@wallet-components/Fees';
import { useSendFormContext, useStakeFormContext } from '@wallet-hooks';

const StyledCard = styled(Card)`
    display: flex;
    margin-bottom: 8px;
    padding: 32px 42px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 32px 20px;
    }
`;

interface FeesWrapperProps {
    useContext: typeof useSendFormContext | typeof useStakeFormContext;
}

export const FeesWrapper = ({ useContext }: FeesWrapperProps) => {
    const {
        formState,
        register,
        control,
        setValue,
        getValues,
        changeFeeLevel,
        account,
        feeInfo,
        composedLevels,
    } = useContext();

    return (
        <StyledCard>
            <Fees
                control={control}
                errors={formState.errors}
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
