import { getDisplaySymbol } from '@suite-common/wallet-config';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Banner, Column, InfoItem, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Translation } from 'src/components/suite';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSelector } from 'src/hooks/suite';
import { useUnstakeFormContext } from 'src/hooks/wallet/useUnstakeForm';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { ApproximateInstantEthAmount } from 'src/views/wallet/staking/components/EthStakingDashboard/components/ApproximateInstantEthAmount';

import { UnstakeInputs } from './UnstakeInputs';
import { SolanaStakingLimitBanner } from '../../SolanaStakingLimitBanner';
import { StakeAvailableBalance } from '../../StakeModal/StakeForm/StakeAvailableBalance';

export const UnstakeForm = () => {
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
        trigger,
    } = useUnstakeFormContext();

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
                                    symbol: getDisplaySymbol(account.symbol),
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

                <StakeAvailableBalance
                    formattedBalance={autocompoundBalance}
                    symbol={account.symbol}
                />

                <Column gap={spacings.lg}>
                    <UnstakeInputs />
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
                    trigger={trigger}
                />

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
                                        symbol: getDisplaySymbol(account.symbol),
                                    }}
                                />
                            </Tooltip>
                        }
                        typographyStyle="body"
                        direction="row"
                    >
                        <ApproximateInstantEthAmount
                            value={approximatedInstantEthAmount}
                            symbol={account.symbol}
                        />
                    </InfoItem>
                )}
            </Column>
        </form>
    );
};
