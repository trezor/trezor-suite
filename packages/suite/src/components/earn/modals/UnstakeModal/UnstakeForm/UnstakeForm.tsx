import { FormProvider } from 'react-hook-form';

import { Translation } from '@suite/intl';
import {
    getSolanaUnstakeAmountBounds,
    getStakingDataForNetwork,
    getStakingHelpCenterLink,
} from '@suite-common/staking';
import { getDisplaySymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Banner, Card, Column, InfoItem, Link, Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { SolanaStakingLimitBanner } from 'src/components/suite/modals/ReduxModal/UserContextModal/SolanaStakingLimitBanner';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useWithdrawalFormContext } from 'src/hooks/earn/useWithdrawalForm';
import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from 'src/types/earn/earnFormFields';
import { ApproximateInstantEthAmount } from 'src/views/wallet/staking/components/EthStakingDashboard/ApproximateInstantEthAmount';

import { UnstakeInputs } from './UnstakeInputs';
import { EarnAvailableBalance } from '../../StakeModal/StakeForm/EarnAvailableBalance';

export const UnstakeForm = () => {
    const {
        account,
        formState: { errors },
        handleSubmit,
        signTx,
        approximatedInstantEthAmount,
        changeFeeLevel,
        feeInfo,
        composedLevels,
        methods,
        onCryptoAmountChange,
        getValues,
    } = useWithdrawalFormContext();

    const { symbol, networkType } = account;

    const isCardanoNetwork = networkType === 'cardano';

    const {
        autocompoundBalance = '0',
        canClaim = false,
        claimableAmount = '0',
    } = getStakingDataForNetwork(account) ?? {};

    const inputError = errors[CRYPTO_INPUT] || errors[FIAT_INPUT] || errors?.outputs?.[0]?.amount;
    const showError = inputError && !['required', 'min'].includes(inputError.type);

    const unstakeAmountBounds =
        inputError?.type === 'solanaUnstakeAmount'
            ? getSolanaUnstakeAmountBounds(account, getValues(OUTPUT_AMOUNT) ?? '')
            : null;

    const renderClickableUnstakeAmount = (amount: string) => (
        <Link onClick={() => onCryptoAmountChange(amount)}>{amount}</Link>
    );
    const renderUnstakeAmountFiat = (amount: string) => (
        <BaseCurrencyValue amount={amount} symbol={account.symbol} showApproximationIndicator>
            {({ value }) => (value ? <>&nbsp;({value})</> : null)}
        </BaseCurrencyValue>
    );
    const shouldShowInstantWithdrawalEthAmount =
        approximatedInstantEthAmount && BigNumber(approximatedInstantEthAmount).gt(0);

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(signTx)}>
                <Column gap={32} margin={{ bottom: 20 }}>
                    <Column gap={16}>
                        {canClaim && (
                            <Banner
                                intent="info"
                                description={
                                    <Translation
                                        id="TR_STAKE_CAN_CLAIM_WARNING"
                                        values={{
                                            amount: claimableAmount,
                                            symbol: getDisplaySymbol(account.symbol),
                                            br: <br />,
                                        }}
                                    />
                                }
                            />
                        )}
                        <SolanaStakingLimitBanner
                            account={account}
                            composedLevels={composedLevels}
                            type="unstake"
                        />
                    </Column>
                    {!isCardanoNetwork && (
                        <>
                            <EarnAvailableBalance
                                formattedBalance={autocompoundBalance}
                                symbol={symbol}
                            />

                            <Column gap={20}>
                                <UnstakeInputs />
                                {showError && (
                                    <Banner
                                        intent="critical"
                                        description={
                                            unstakeAmountBounds ? (
                                                <Translation
                                                    id={
                                                        unstakeAmountBounds.closestLower
                                                            ? 'TR_STAKE_SOL_INVALID_UNSTAKE_AMOUNT'
                                                            : 'TR_STAKE_SOL_INVALID_UNSTAKE_AMOUNT_HIGHER_ONLY'
                                                    }
                                                    values={{
                                                        symbol: getNetworkDisplaySymbol(
                                                            account.symbol,
                                                        ),
                                                        higher: renderClickableUnstakeAmount(
                                                            unstakeAmountBounds.closestHigher,
                                                        ),
                                                        higherFiat: renderUnstakeAmountFiat(
                                                            unstakeAmountBounds.closestHigher,
                                                        ),
                                                        lower: unstakeAmountBounds.closestLower
                                                            ? renderClickableUnstakeAmount(
                                                                  unstakeAmountBounds.closestLower,
                                                              )
                                                            : undefined,
                                                        lowerFiat: unstakeAmountBounds.closestLower
                                                            ? renderUnstakeAmountFiat(
                                                                  unstakeAmountBounds.closestLower,
                                                              )
                                                            : undefined,
                                                    }}
                                                />
                                            ) : (
                                                inputError?.message
                                            )
                                        }
                                        rightContent={
                                            inputError?.type === 'solanaUnstakeAmount' ? (
                                                <Banner.Button
                                                    href={getStakingHelpCenterLink(
                                                        account.networkType,
                                                    )}
                                                >
                                                    <Translation id="TR_STAKE_FIND_OUT_MORE" />
                                                </Banner.Button>
                                            ) : undefined
                                        }
                                    />
                                )}
                            </Column>
                        </>
                    )}

                    <Card type="raised" paddingType="small">
                        <Fees
                            feeInfo={feeInfo}
                            account={account}
                            composedLevels={composedLevels}
                            changeFeeLevel={changeFeeLevel}
                            headerTypographyStyle="body-sm"
                        />
                    </Card>

                    {shouldShowInstantWithdrawalEthAmount && (
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
                            typographyStyle="body-md"
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
        </FormProvider>
    );
};
