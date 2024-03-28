import styled from 'styled-components';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useClaimEthFormContext } from 'src/hooks/wallet/useClaimEthForm';
import { Translation } from 'src/components/suite';

const StyledCard = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: space-between;
    margin: 25px 0;
`;

const ClaimFees = () => {
    const {
        formState: { errors },
        register,
        control,
        setValue,
        getValues,
        account,
        changeFeeLevel,
        feeInfo,
        composedLevels,
    } = useClaimEthFormContext();

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
                helperText={<Translation id="TR_STAKE_PAID_FROM_BALANCE" />}
            />
        </StyledCard>
    );
};

export default ClaimFees;
