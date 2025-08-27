import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useStakeFormContext } from 'src/hooks/wallet/useStakeForm';

import { ConfirmStakeModal } from './ConfirmStakeModal';
import { StakeAvailableBalance } from './StakeAvailableBalance';
import { StakeInputs } from './StakeInputs';
import { StakeRegistrationDepositCard } from './StakeRegistrationDepositCard';

export const StakeForm = () => {
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
        trigger,
    } = useStakeFormContext();

    const { formattedBalance, symbol, networkType } = account;

    const isCardanoNetwork = networkType === 'cardano';

    return (
        <>
            {isConfirmModalOpen && (
                <ConfirmStakeModal
                    isLoading={isLoading}
                    onConfirm={signTx}
                    onCancel={closeConfirmModal}
                />
            )}

            <Column gap={spacings.xxl} margin={{ bottom: spacings.lg }}>
                {isCardanoNetwork ? (
                    <StakeRegistrationDepositCard account={account} />
                ) : (
                    <>
                        <StakeAvailableBalance
                            formattedBalance={formattedBalance}
                            symbol={symbol}
                        />

                        <StakeInputs />
                    </>
                )}

                <Fees
                    control={control}
                    errors={errors}
                    isDirty={isDirty}
                    register={register}
                    feeInfo={feeInfo}
                    setValue={setValue}
                    getValues={getValues}
                    trigger={trigger}
                    account={account}
                    composedLevels={composedLevels}
                    changeFeeLevel={changeFeeLevel}
                />
            </Column>
        </>
    );
};
