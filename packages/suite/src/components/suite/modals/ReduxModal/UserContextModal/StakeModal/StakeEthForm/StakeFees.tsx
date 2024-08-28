import { Fees } from 'src/components/wallet/Fees/Fees';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import { Translation } from 'src/components/suite';

export const StakeFees = () => {
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
    } = useStakeEthFormContext();

    return (
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
            showFeeWhilePending={false}
        />
    );
};
