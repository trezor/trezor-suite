import { FormProvider } from 'react-hook-form';

import { type StakeModalFlow } from '@suite-common/suite-types/src/staking';
import { Card, Column } from '@trezor/components';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSupplyFormContext } from 'src/hooks/earn/useSupplyForm';

import { CardanoStakeWarningBanner } from './CardanoStakeWarningBanner';
import { ConfirmStakeModal } from './ConfirmStakeModal';
import { EarnAvailableBalance } from './EarnAvailableBalance';
import { StakeInputs } from './StakeInputs';
import { StakeRegistrationDepositCard } from './StakeRegistrationDepositCard';

type StakeFormProps = {
    flow: StakeModalFlow;
};

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
    } = useSupplyFormContext();

    const { formattedBalance, symbol, networkType } = account;
    const isCardanoNetwork = networkType === 'cardano';

    return (
        <FormProvider {...methods}>
            {isConfirmModalOpen && (
                <ConfirmStakeModal
                    account={account}
                    isLoading={isLoading}
                    onConfirm={signTx}
                    onCancel={closeConfirmModal}
                    flow={flow}
                />
            )}

            <Column gap={32} margin={{ bottom: 20 }}>
                {isCardanoNetwork ? (
                    <StakeRegistrationDepositCard account={account} />
                ) : (
                    <>
                        <EarnAvailableBalance formattedBalance={formattedBalance} symbol={symbol} />
                        <StakeInputs />
                    </>
                )}

                <Card fillType="default" paddingType="small">
                    <Fees
                        feeInfo={feeInfo}
                        account={account}
                        composedLevels={composedLevels}
                        changeFeeLevel={changeFeeLevel}
                        headerTypographyStyle="body-sm"
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
