import { Card } from '@trezor/components';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSendFormContext } from 'src/hooks/wallet';

export const SendFees = () => {
    const {
        formState: { errors },
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
        <Card>
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
        </Card>
    );
};
