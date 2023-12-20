import styled from 'styled-components';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useCoinmarketSellFormContext } from 'src/hooks/wallet/useCoinmarketSellForm';

const StyledCard = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: space-between;
    margin: 25px 0;
`;

// wrapper for shareable Fees component
const SellFees = () => {
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
    } = useCoinmarketSellFormContext();

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
            />
        </StyledCard>
    );
};

export default SellFees;
