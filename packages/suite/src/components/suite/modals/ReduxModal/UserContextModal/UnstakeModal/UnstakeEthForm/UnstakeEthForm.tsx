import { InfoRow, Tooltip, Banner, Column, Card } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { getAccountEverstakeStakingPool } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { getUnstakingPeriodInDays } from 'src/utils/suite/stake';
import { ApproximateInstantEthAmount } from 'src/views/wallet/staking/components/EthStakingDashboard/components/ApproximateInstantEthAmount';

import { Options } from './Options';

export const UnstakeEthForm = () => {
    const selectedAccount = useSelector(selectSelectedAccount);

    const {
        account,
        formState: { errors },
        handleSubmit,
        signTx,
        approximatedInstantEthAmount,
        register,
        control,
        setValue,
        getValues,
        changeFeeLevel,
        feeInfo,
        composedLevels,
    } = useUnstakeEthFormContext();

    const { symbol } = account;

    const { validatorWithdrawTime } = useSelector(state =>
        selectValidatorsQueueData(state, account?.symbol),
    );
    const unstakingPeriod = getUnstakingPeriodInDays(validatorWithdrawTime);
    const { canClaim = false, claimableAmount = '0' } =
        getAccountEverstakeStakingPool(selectedAccount) ?? {};

    const inputError = errors[CRYPTO_INPUT] || errors[FIAT_INPUT];
    const showError = inputError && inputError.type === 'compose';
    const shouldShowInstantUnstakeEthAmount =
        approximatedInstantEthAmount && BigNumber(approximatedInstantEthAmount).gt(0);

    return (
        <form onSubmit={handleSubmit(signTx)}>
            <Column alignItems="stretch" gap={spacings.xxl} margin={{ bottom: spacings.lg }}>
                {canClaim && (
                    <Banner variant="info">
                        <Translation
                            id="TR_STAKE_CAN_CLAIM_WARNING"
                            values={{
                                amount: claimableAmount,
                                symbol: symbol.toUpperCase(),
                                br: <br />,
                            }}
                        />
                    </Banner>
                )}

                <Column alignItems="stretch" gap={spacings.lg}>
                    <Options symbol={symbol} />
                    {showError && <Banner variant="destructive">{inputError?.message}</Banner>}
                </Column>

                <Card paddingType="small" margin={{ vertical: spacings.xs }}>
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

                <InfoRow
                    label={<Translation id="TR_STAKE_UNSTAKING_PERIOD" />}
                    labelTypographyStyle="body"
                    direction="row"
                >
                    <Translation
                        id="TR_UP_TO_DAYS"
                        values={{
                            count: unstakingPeriod,
                        }}
                    />
                </InfoRow>

                {shouldShowInstantUnstakeEthAmount && (
                    <InfoRow
                        label={
                            <Tooltip
                                maxWidth={328}
                                content={
                                    <Translation id="TR_STAKE_UNSTAKING_APPROXIMATE_DESCRIPTION" />
                                }
                                hasIcon
                            >
                                <Translation
                                    id="TR_STAKE_UNSTAKING_APPROXIMATE"
                                    values={{
                                        symbol: symbol.toUpperCase(),
                                    }}
                                />
                            </Tooltip>
                        }
                        labelTypographyStyle="body"
                        direction="row"
                    >
                        <ApproximateInstantEthAmount
                            value={approximatedInstantEthAmount}
                            symbol={symbol.toUpperCase()}
                        />
                    </InfoRow>
                )}
            </Column>
        </form>
    );
};
