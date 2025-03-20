import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';

import { AvailableBalance } from './AvailableBalance';
import { ConfirmStakeEthModal } from './ConfirmStakeEthModal';
import { Inputs } from './Inputs';

export const StakeEthForm = () => {
    const {
        account,
        isConfirmModalOpen,
        closeConfirmModal,
        signTx,
        isLoading,
        formState: { errors, isDirty },
        register,
        control,
        setValue,
        getValues,
        changeFeeLevel,
        feeInfo,
        composedLevels,
    } = useStakeEthFormContext();

    const { formattedBalance, symbol } = account;

    return (
        <>
            {isConfirmModalOpen && (
                <ConfirmStakeEthModal
                    isLoading={isLoading}
                    onConfirm={signTx}
                    onCancel={closeConfirmModal}
                />
            )}

            <Column gap={spacings.xxl} margin={{ bottom: spacings.lg }}>
                <AvailableBalance formattedBalance={formattedBalance} symbol={symbol} />

                <Inputs />

                <Fees
                    control={control}
                    errors={errors}
                    isDirty={isDirty}
                    register={register}
                    feeInfo={feeInfo}
                    setValue={setValue}
                    getValues={getValues}
                    account={account}
                    composedLevels={composedLevels}
                    changeFeeLevel={changeFeeLevel}
                />
            </Column>
        </>
    );
};
