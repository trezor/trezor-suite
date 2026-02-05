import { useEffect } from 'react';
import { FormProvider } from 'react-hook-form';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Banner, Card, Column, InfoItem, Modal, Paragraph, Row, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { useClaimForm } from 'src/hooks/wallet/useClaimForm';
import { useAnalytics } from 'src/support/useAnalytics';
import { CRYPTO_INPUT } from 'src/types/wallet/stakeForms';

import { SolanaStakingLimitBanner } from '../SolanaStakingLimitBanner';

interface ClaimModalModalProps {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
}

const ClaimModalLoaded = ({ onCancel, selectedAccount }: ClaimModalModalProps) => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const analytics = useAnalytics();
    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(
        selectedAccount.network.symbol,
    );

    const {
        account,
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
    } = useClaimForm({ selectedAccount });
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, account.symbol));

    const isCardanoNetworkType = selectedAccount?.account.networkType === 'cardano';

    const hasValues = Boolean(watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    const { claimableAmount = '0', restakedReward = '0' } =
        getStakingDataForNetwork(selectedAccount.account) ?? {};

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
                networkSymbol: selectedAccount.account.symbol,
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
                networkSymbol: selectedAccount.account.symbol,
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
                    <Column gap={spacings.md}>
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
                                    <Column gap={spacings.md} hasDivider>
                                        {shouldShowCardanoClaimRewardsCard && (
                                            <Row justifyContent="space-between">
                                                <Column>
                                                    <Paragraph typographyStyle="body">
                                                        <Translation id="TR_STAKE_REWARDS" />
                                                    </Paragraph>
                                                </Column>
                                                <Column>
                                                    <Row
                                                        gap={spacings.lg}
                                                        justifyContent="flex-end"
                                                    >
                                                        <Paragraph typographyStyle="highlight">
                                                            <FormattedCryptoAmount
                                                                data-testid="@modal/claim/rewards-amount"
                                                                value={restakedReward}
                                                                symbol={account.symbol}
                                                            />
                                                        </Paragraph>
                                                    </Row>
                                                    <Row
                                                        gap={spacings.lg}
                                                        justifyContent="flex-end"
                                                    >
                                                        <Paragraph
                                                            variant="tertiary"
                                                            typographyStyle="hint"
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
                                    <Paragraph typographyStyle="titleSmall">
                                        <FormattedCryptoAmount
                                            data-testid="@staking/claim-modal/amount"
                                            value={claimableAmount}
                                            symbol={account.symbol}
                                        />
                                    </Paragraph>
                                    <Paragraph typographyStyle="label" variant="tertiary">
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
                                    headerTypographyStyle="hint"
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

export const ClaimModal = ({ onCancel }: Omit<ClaimModalModalProps, 'selectedAccount'>) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded' || !selectedAccount.account) {
        onCancel?.();

        return null;
    }

    return (
        <ClaimModalLoaded
            onCancel={onCancel}
            selectedAccount={selectedAccount as SelectedAccountLoaded}
        />
    );
};
