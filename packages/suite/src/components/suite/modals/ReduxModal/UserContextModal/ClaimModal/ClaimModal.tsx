import { useEffect } from 'react';

import { Paragraph, Tooltip, Banner, Card, Column, InfoItem, NewModal } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { getAccountEverstakeStakingPool } from '@suite-common/wallet-utils';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { Translation, FiatValue, FormattedCryptoAmount } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import { useClaimEthForm } from 'src/hooks/wallet/useClaimEthForm';
import { CRYPTO_INPUT } from 'src/types/wallet/stakeForms';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

interface ClaimModalModalProps {
    onCancel?: () => void;
}

export const ClaimModal = ({ onCancel }: ClaimModalModalProps) => {
    const { device, isLocked } = useDevice();
    const selectedAccount = useSelector(
        state => state.wallet.selectedAccount,
    ) as SelectedAccountLoaded;
    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking();

    const {
        account,
        formState: { errors, isSubmitting },
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

    const { claimableAmount = '0' } = getAccountEverstakeStakingPool(selectedAccount.account) ?? {};
    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || isLocked() || !device?.available;

    useEffect(() => {
        onClaimChange(claimableAmount);
    }, [onClaimChange, claimableAmount]);

    // it shouldn't be possible to open this modal without having selected account
    if (!selectedAccount?.account || selectedAccount?.status !== 'loaded') return null;

    return (
        <NewModal
            heading={<Translation id="TR_STAKE_CLAIM" />}
            description={
                <Translation
                    id="TR_STAKE_CLAIMED_AMOUNT_TRANSFERRED"
                    values={{ symbol: account.symbol.toUpperCase() }}
                />
            }
            size="small"
            onCancel={onCancel}
            bottomContent={
                <>
                    <Tooltip content={claimingMessageContent}>
                        <NewModal.Button
                            type="submit"
                            isDisabled={isDisabled || isClaimingDisabled}
                            isLoading={isComposing || isSubmitting}
                            onClick={handleSubmit(signTx)}
                            icon={isClaimingDisabled ? 'info' : undefined}
                        >
                            <Translation id="TR_STAKE_CLAIM" />
                        </NewModal.Button>
                    </Tooltip>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <form onSubmit={handleSubmit(signTx)}>
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
                            showFeeWhilePending={true}
                        />
                    </Card>

                    {errors[CRYPTO_INPUT] && (
                        <Banner variant="destructive">{errors[CRYPTO_INPUT]?.message}</Banner>
                    )}
                </Column>
            </form>
        </NewModal>
    );
};
