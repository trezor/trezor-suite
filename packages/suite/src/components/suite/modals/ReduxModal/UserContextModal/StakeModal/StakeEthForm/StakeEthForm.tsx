import { Column, Card } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import { Translation } from 'src/components/suite';
import { Fees } from 'src/components/wallet/Fees/Fees';

import { Inputs } from './Inputs';
import { ConfirmStakeEthModal } from './ConfirmStakeEthModal';
import { AvailableBalance } from './AvailableBalance';

export const StakeEthForm = () => {
    const {
        account,
        isConfirmModalOpen,
        closeConfirmModal,
        signTx,
        isLoading,
        formState: { errors },
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

                <Card paddingType="small" margin={{ top: spacings.xs }}>
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
                </Card>
            </Column>
        </>
    );
};
