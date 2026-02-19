import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { Account } from '@suite-common/wallet-types';
import { Banner, Card, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSupplyFormContext } from 'src/hooks/earn/useSupplyForm';

import { CardanoStakeWarningBanner } from './CardanoStakeWarningBanner';
import { ConfirmSupplyModal } from './ConfirmSupplyModal';
import { EarnAvailableBalance } from './EarnAvailableBalance';
import { StakeRegistrationDepositCard } from './StakeRegistrationDepositCard';
import { SupplyInputs } from './SupplyInputs';

type SupplyFormProps = {
    flow: EarnFlow;
    account?: Account;
};

const StakingSupplyForm = ({ flow }: Pick<SupplyFormProps, 'flow'>) => {
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
                <ConfirmSupplyModal
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
                        <EarnAvailableBalance formattedBalance={formattedBalance} symbol={symbol} />

                        <SupplyInputs />
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

const YieldSupplyForm = ({ account }: { account: Account }) => (
    <Column gap={spacings.xl} margin={{ bottom: spacings.lg }}>
        <EarnAvailableBalance formattedBalance={account.formattedBalance} symbol={account.symbol} />
        <Banner intent="info" description={<Translation id="TR_EARN_NOT_AVAILABLE" />} />
    </Column>
);

export const SupplyForm = ({ flow, account }: SupplyFormProps) => {
    if (flow === EarnFlow.Yield) {
        if (!account) {
            return null;
        }

        return <YieldSupplyForm account={account} />;
    }

    return <StakingSupplyForm flow={flow} />;
};
