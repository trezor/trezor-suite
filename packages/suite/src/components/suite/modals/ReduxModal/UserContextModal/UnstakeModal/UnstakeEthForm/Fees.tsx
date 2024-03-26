import styled from 'styled-components';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { Translation } from 'src/components/suite';

const StyledCard = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: space-between;
    margin: 25px 0;
`;

const UnstakeFees = () => {
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
    } = useUnstakeEthFormContext();

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

export default UnstakeFees;
