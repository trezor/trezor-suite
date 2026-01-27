import { FormProvider } from 'react-hook-form';

import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { Card, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useStakeFormContext } from 'src/hooks/wallet/useStakeForm';

import { CardanoStakeWarningBanner } from './CardanoStakeWarningBanner';
import { ConfirmStakeModal } from './ConfirmStakeModal';
import { StakeAvailableBalance } from './StakeAvailableBalance';
import { StakeInputs } from './StakeInputs';
import { StakeRegistrationDepositCard } from './StakeRegistrationDepositCard';

interface StakeFormProps {
    flow: EarnFlow;
}

export const StakeForm = ({ flow }: StakeFormProps) => {
    const {
        account,
        isConfirmModalOpen,
        closeConfirmModal,
        signTx,
        isLoading,
        changeFeeLevel,
        feeInfo,
        composedLevels,
        isStakingDisabled,
        methods,
    } = useStakeFormContext();

    const { formattedBalance, symbol, networkType } = account;

    const isCardanoNetwork = networkType === 'cardano';

    return (
        <FormProvider {...methods}>
            {isConfirmModalOpen && (
                <ConfirmStakeModal
                    isLoading={isLoading}
                    onConfirm={signTx}
                    onCancel={closeConfirmModal}
                    flow={flow}
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

                <Card fillType="default" paddingType="small">
                    <Fees
                        feeInfo={feeInfo}
                        account={account}
                        composedLevels={composedLevels}
                        changeFeeLevel={changeFeeLevel}
                        headerTypographyStyle="hint"
                    />
                </Card>

                {isCardanoNetwork && (
                    <CardanoStakeWarningBanner
                        account={account}
                        isCardanoStakingDisabled={isStakingDisabled}
                    />
                )}
            </Column>
        </FormProvider>
    );
};
