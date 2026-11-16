import { useFormState } from 'react-hook-form';

import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { Banner, Card, Column } from '@trezor/components';

import { Fees } from '#src/components/wallet/Fees/Fees';

import { useTronStakeContext } from './TronStakeContext';

export const TronStakeFees = () => {
    const { account, fees, actions, form } = useTronStakeContext();
    const { errors } = useFormState({ control: form.methods.control });
    const { feeInfo, composedLevels } = fees;
    const transaction = composedLevels?.normal;
    const feeEstimate =
        transaction?.type === 'error' ? transaction.estimatedTransaction : undefined;
    const displayLevels = feeEstimate ? { normal: feeEstimate } : composedLevels;
    const hasInvalidUnstakeAmount =
        actions.step === 'unstake' && !!(errors.amount || errors.fiatAmount);
    const canRetryFeeEstimate =
        actions.step !== 'freeze' &&
        !hasInvalidUnstakeAmount &&
        fees.hasError &&
        actions.pendingTxid === null;
    const hasInsufficientFunds =
        transaction?.type === 'error' && transaction.error === 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE';

    return (
        <>
            <Card paddingType="none">
                <Column gap={16} padding={{ vertical: 16, horizontal: 20 }}>
                    <Fees
                        account={account}
                        feeInfo={feeInfo}
                        composedLevels={displayLevels}
                        changeFeeLevel={() => {}}
                    />
                    {canRetryFeeEstimate && (
                        <Banner
                            intent="warning"
                            description={<Translation id="TR_EARN_YIELD_ERROR_FEE_ESTIMATION" />}
                            rightContent={
                                <Banner.Button onClick={fees.retry}>
                                    <Translation id="TR_TRY_AGAIN" />
                                </Banner.Button>
                            }
                        />
                    )}
                </Column>
            </Card>

            {hasInsufficientFunds && actions.pendingTxid === null && (
                <Banner
                    intent="warning"
                    data-testid="@staking/tron/insufficient-funds-banner"
                    description={
                        <Translation
                            id="AMOUNT_NOT_ENOUGH_CURRENCY_FEE"
                            values={{
                                networkDisplaySymbol: (
                                    <AssetSymbol networkSymbol={account.symbol} />
                                ),
                            }}
                        />
                    }
                />
            )}
        </>
    );
};
