import { useEffect } from 'react';
import { FormProvider } from 'react-hook-form';

import { events } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Banner, Card, Column, InfoItem, Modal, Paragraph, Row, Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { SolanaStakingLimitBanner } from 'src/components/suite/modals/ReduxModal/UserContextModal/SolanaStakingLimitBanner';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useCardanoStaking } from 'src/hooks/earn/useCardanoStaking';
import { useClaimForm } from 'src/hooks/earn/useClaimForm';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useAnalytics } from 'src/support/useAnalytics';
import { CRYPTO_INPUT } from 'src/types/earn/earnFormFields';

type EarnClaimModalProps = {
    onCancel?: () => void;
    account: Account;
};

export const EarnClaimModal = ({ onCancel, account }: EarnClaimModalProps) => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const analytics = useAnalytics();
    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(account.symbol);

    const {
        formState: { errors, isSubmitting },
        changeFeeLevel,
        feeInfo,
        composedLevels,
        watch,
        isComposing,
        handleSubmit,
        onClaimChange,
        signTx,
        methods,
        isClaimingDisabled: isCardanoClaimingDisabled,
    } = useClaimForm({ account });
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, account.symbol));

    const isCardanoNetworkType = account.networkType === 'cardano';

    const hasValues = Boolean(watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    const { claimableAmount = '0', restakedReward = '0' } = getStakingDataForNetwork(account) ?? {};

    const isFormInputsValid = !isCardanoNetworkType
        ? formIsValid && hasValues
        : !isCardanoClaimingDisabled;

    const isDeviceConnected = device?.connected && device?.available;

    const isDisabled = !isFormInputsValid || isSubmitting || (isDeviceConnected && isLocked());
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    // cardano specific logic
    const { calculateFeeAndDeposit, withdrawingAvailable, fee, rewards } = useCardanoStaking();
    const isCardanoWithdrawalBalanceInsufficient =
        isCardanoNetworkType &&
        !withdrawingAvailable.status &&
        withdrawingAvailable.reason === 'UTXO_BALANCE_INSUFFICIENT';
    const isCardanoFeeGreaterThanRewards =
        isCardanoNetworkType && new BigNumber(fee ?? '0').isGreaterThan(rewards ?? '0');
    const shouldShowCardanoWarning =
        isCardanoNetworkType &&
        (isCardanoWithdrawalBalanceInsufficient || isCardanoFeeGreaterThanRewards);
    const shouldShowCardanoClaimRewardsCard =
        isCardanoNetworkType && !!restakedReward && restakedReward !== '0';

    useEffect(() => {
        if (!isCardanoNetworkType) return;
        calculateFeeAndDeposit('withdrawal');
    }, [calculateFeeAndDeposit, isCardanoNetworkType]);

    // other logic
    useEffect(() => {
        onClaimChange(claimableAmount);
    }, [onClaimChange, claimableAmount]);

    const onClaimClick = () => {
        if (!isDeviceConnected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            dispatch(setConnectionModal(true));

            return;
        }

        handleSubmit(signTx)();

        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'continue',
                step: 'claim-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    const onCancelClick = () => {
        onCancel?.();

        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'cancel',
                step: 'claim-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    const isLoading = isComposing || isSubmitting || isDiscoveryRunning || areFeesLoading;

    return (
        <Modal
            data-testid="@staking/claim-modal"
            heading={
                <Translation
                    id={isCardanoNetworkType ? 'TR_STAKE_CLAIM_REWARDS' : 'TR_STAKE_CLAIM_TOKEN'}
                    values={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
                />
            }
            description={
                !isCardanoNetworkType ? (
                    <Translation
                        id="TR_STAKE_CLAIMED_AMOUNT_TRANSFERRED"
                        values={{ networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol) }}
                    />
                ) : undefined
            }
            width={600}
            onCancel={onCancelClick}
            bottomContent={
                <>
                    <Tooltip content={claimingMessageContent}>
                        <Modal.Button
                            type="submit"
                            isDisabled={isDisabled || isClaimingDisabled || !formIsValid}
                            isLoading={isLoading}
                            onClick={onClaimClick}
                            iconLeft={isClaimingDisabled ? 'info' : undefined}
                            data-testid="@staking/claim-modal/continue-button"
                        >
                            {isCardanoNetworkType ? (
                                <Translation id="TR_STAKE_CLAIM_REWARDS" />
                            ) : (
                                <Translation id="TR_CONTINUE" />
                            )}
                        </Modal.Button>
                    </Tooltip>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancelClick}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            // Disable shadow bottom to make `Fees` component fully visible
            shadowBottom={false}
        >
            <FormProvider {...methods}>
                <form onSubmit={onClaimClick}>
                    <Column gap={16}>
                        {isCardanoNetworkType ? (
                            <>
                                {shouldShowCardanoWarning && shouldShowCardanoClaimRewardsCard && (
                                    <Banner
                                        data-testid="@modal/claim/fee-warning-banner"
                                        intent="warning"
                                        icon="warning"
                                        description={
                                            <Translation id="TR_STAKING_REWARDS_NETWORK_FEE_WARNING" />
                                        }
                                    />
                                )}

                                <Card>
                                    <Column gap={16} hasDivider>
                                        {shouldShowCardanoClaimRewardsCard && (
                                            <Row justifyContent="space-between">
                                                <Column>
                                                    <Paragraph typographyStyle="body-md">
                                                        <Translation id="TR_STAKE_REWARDS" />
                                                    </Paragraph>
                                                </Column>
                                                <Column>
                                                    <Row gap={20} justifyContent="flex-end">
                                                        <Paragraph typographyStyle="body-md-strong">
                                                            <FormattedCryptoAmount
                                                                data-testid="@modal/claim/rewards-amount"
                                                                value={restakedReward}
                                                                symbol={account.symbol}
                                                            />
                                                        </Paragraph>
                                                    </Row>
                                                    <Row gap={20} justifyContent="flex-end">
                                                        <Paragraph
                                                            intent="neutral"
                                                            priority="secondary"
                                                            typographyStyle="body-sm"
                                                        >
                                                            <BaseCurrencyValue
                                                                amount={restakedReward}
                                                                symbol={account.symbol}
                                                                showApproximationIndicator
                                                            />
                                                        </Paragraph>
                                                    </Row>
                                                </Column>
                                            </Row>
                                        )}

                                        <Fees
                                            feeInfo={feeInfo}
                                            account={account}
                                            composedLevels={composedLevels}
                                            changeFeeLevel={changeFeeLevel}
                                            label="TR_TRADING_NETWORK_FEE"
                                        />
                                    </Column>
                                </Card>
                            </>
                        ) : (
                            <>
                                <SolanaStakingLimitBanner
                                    account={account}
                                    composedLevels={composedLevels}
                                    type="claim"
                                />

                                <InfoItem direction="column" label={<Translation id="AMOUNT" />}>
                                    <Paragraph typographyStyle="headline-sm">
                                        <FormattedCryptoAmount
                                            data-testid="@staking/claim-modal/amount"
                                            value={claimableAmount}
                                            symbol={account.symbol}
                                        />
                                    </Paragraph>
                                    <Paragraph
                                        typographyStyle="body-xs"
                                        intent="neutral"
                                        priority="secondary"
                                    >
                                        <BaseCurrencyValue
                                            showApproximationIndicator
                                            amount={claimableAmount}
                                            symbol={account.symbol}
                                        />
                                    </Paragraph>
                                </InfoItem>

                                <InfoItem
                                    direction="column"
                                    label={<Translation id="TR_STAKE_CLAIMING_PERIOD" />}
                                >
                                    <Translation id="TR_STAKE_CLAIM_IN_NEXT_BLOCK" />
                                </InfoItem>

                                <Fees
                                    feeInfo={feeInfo}
                                    account={account}
                                    composedLevels={composedLevels}
                                    changeFeeLevel={changeFeeLevel}
                                    headerTypographyStyle="body-sm"
                                />
                            </>
                        )}

                        {errors[CRYPTO_INPUT] && (
                            <Banner intent="critical" description={errors[CRYPTO_INPUT]?.message} />
                        )}
                    </Column>
                </form>
            </FormProvider>
        </Modal>
    );
};
