import { useEffect } from 'react';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Banner, Column, InfoItem, Modal, Paragraph, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDevice, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useClaimEthForm } from 'src/hooks/wallet/useClaimEthForm';
import { CRYPTO_INPUT } from 'src/types/wallet/stakeForms';

interface ClaimModalModalProps {
    onCancel?: () => void;
    selectedAccount: SelectedAccountLoaded;
}

const ClaimModalLoaded = ({ onCancel, selectedAccount }: ClaimModalModalProps) => {
    const { device, isLocked } = useDevice();
    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(
        selectedAccount.network.symbol,
    );

    const {
        account,
        formState: { errors, isSubmitting, isDirty },
        register,
        control,
        setValue,
        getValues,
        changeFeeLevel,
        feeInfo,
        composedLevels,
        watch,
        isComposing,
        handleSubmit,
        onClaimChange,
        signTx,
    } = useClaimEthForm({ selectedAccount });

    const hasValues = Boolean(watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    const { claimableAmount = '0' } = getStakingDataForNetwork(selectedAccount.account) ?? {};
    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || isLocked() || !device?.available;

    useEffect(() => {
        onClaimChange(claimableAmount);
    }, [onClaimChange, claimableAmount]);

    const onClaimClick = () => {
        handleSubmit(signTx)();

        analytics.report({
            type: EventType.StakingClaim,
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
            type: EventType.StakingClaim,
            payload: {
                action: 'cancel',
                step: 'claim-form-modal',
                networkSymbol: selectedAccount.account.symbol,
            },
        });
    };

    return (
        <Modal
            heading={<Translation id="TR_STAKE_CLAIM" />}
            description={
                <Translation
                    id="TR_STAKE_CLAIMED_AMOUNT_TRANSFERRED"
                    values={{ networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol) }}
                />
            }
            size="small"
            onCancel={onCancelClick}
            bottomContent={
                <>
                    <Tooltip content={claimingMessageContent}>
                        <Modal.Button
                            type="submit"
                            isDisabled={isDisabled || isClaimingDisabled}
                            isLoading={isComposing || isSubmitting}
                            onClick={onClaimClick}
                            icon={isClaimingDisabled ? 'info' : undefined}
                        >
                            <Translation id="TR_STAKE_CLAIM" />
                        </Modal.Button>
                    </Tooltip>
                    <Modal.Button variant="tertiary" onClick={onCancelClick}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <form onSubmit={onClaimClick}>
                <Column gap={spacings.lg}>
                    <InfoItem direction="column" label={<Translation id="AMOUNT" />}>
                        <Paragraph typographyStyle="titleSmall">
                            <FormattedCryptoAmount
                                value={claimableAmount}
                                symbol={account.symbol}
                            />
                        </Paragraph>
                        <Paragraph typographyStyle="label" variant="tertiary">
                            <FiatValue
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

                    {errors[CRYPTO_INPUT] && (
                        <Banner variant="destructive">{errors[CRYPTO_INPUT]?.message}</Banner>
                    )}
                </Column>
            </form>
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
