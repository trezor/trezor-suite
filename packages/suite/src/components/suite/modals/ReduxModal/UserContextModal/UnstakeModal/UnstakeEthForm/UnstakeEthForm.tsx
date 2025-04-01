import { getDisplaySymbol } from '@suite-common/wallet-config';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { getStakingDataForNetwork, getUnstakingPeriodInDays } from '@suite-common/wallet-utils';
import { Banner, Column, InfoItem, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Translation } from 'src/components/suite';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSelector } from 'src/hooks/suite';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { ApproximateInstantEthAmount } from 'src/views/wallet/staking/components/EthStakingDashboard/components/ApproximateInstantEthAmount';

import { Inputs } from './Inputs';
import { SolanaStakingLimitBanner } from '../../SolanaStakingLimitBanner';
import { AvailableBalance } from '../../StakeModal/StakeEthForm/AvailableBalance';

export const UnstakeEthForm = () => {
    const selectedAccount = useSelector(selectSelectedAccount);

    const {
        account,
        formState: { errors, isDirty },
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

    const { symbol, networkType } = account;

    const { validatorWithdrawTime } = useSelector(state =>
        selectValidatorsQueueData(state, account?.symbol),
    );
    const unstakingPeriod = getUnstakingPeriodInDays({ networkType, validatorWithdrawTime });
    const {
        autocompoundBalance = '0',
        canClaim = false,
        claimableAmount = '0',
    } = getStakingDataForNetwork(selectedAccount) ?? {};

    const inputError = errors[CRYPTO_INPUT] || errors[FIAT_INPUT] || errors?.outputs?.[0]?.amount;
    const showError = inputError && !['required', 'min'].includes(inputError.type);
    const shouldShowInstantUnstakeEthAmount =
        approximatedInstantEthAmount && BigNumber(approximatedInstantEthAmount).gt(0);

    return (
        <form onSubmit={handleSubmit(signTx)}>
            <Column gap={spacings.xxl} margin={{ bottom: spacings.lg }}>
                <Column gap={spacings.md}>
                    {canClaim && (
                        <Banner variant="info">
                            <Translation
                                id="TR_STAKE_CAN_CLAIM_WARNING"
                                values={{
                                    amount: claimableAmount,
                                    symbol: getDisplaySymbol(symbol),
                                    br: <br />,
                                }}
                            />
                        </Banner>
                    )}

                    <SolanaStakingLimitBanner
                        account={account}
                        composedLevels={composedLevels}
                        type="unstake"
                    />
                </Column>

                <AvailableBalance formattedBalance={autocompoundBalance} symbol={symbol} />

                <Column gap={spacings.lg}>
                    <Inputs />
                    {showError && <Banner variant="destructive">{inputError?.message}</Banner>}
                </Column>

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

                <InfoItem
                    label={<Translation id="TR_STAKE_UNSTAKING_PERIOD" />}
                    typographyStyle="body"
                    direction="row"
                >
                    <Translation
                        id="TR_UP_TO_DAYS"
                        values={{
                            count: unstakingPeriod,
                        }}
                    />
                </InfoItem>

                {shouldShowInstantUnstakeEthAmount && (
                    <InfoItem
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
                        typographyStyle="body"
                        direction="row"
                    >
                        <ApproximateInstantEthAmount
                            value={approximatedInstantEthAmount}
                            symbol={symbol.toUpperCase()}
                        />
                    </InfoItem>
                )}
            </Column>
        </form>
    );
};
