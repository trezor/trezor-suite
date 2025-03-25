import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Button, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';

export const UnstakeButton = () => {
    const { device, isLocked } = useDevice();
    const selectedAccount = useSelector(
        state => state.wallet.selectedAccount,
    ) as SelectedAccountLoaded;
    const { isUnstakingDisabled, unstakingMessageContent } = useMessageSystemStaking(
        selectedAccount.network.symbol,
    );

    const {
        isComposing,
        formState: { isSubmitting, errors },
        handleSubmit,
        watch,
        signTx,
        currency,
    } = useUnstakeEthFormContext();

    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || isLocked() || !device?.available;

    const onUnstakeClick = () => {
        handleSubmit(signTx)();

        analytics.report({
            type: EventType.StakingUnstake,
            payload: {
                action: 'continue',
                step: 'unstake-form-modal',
                currency,
                networkSymbol: selectedAccount.account.symbol,
            },
        });
    };

    return (
        <Tooltip content={unstakingMessageContent}>
            <Button
                type="submit"
                isDisabled={isDisabled || isUnstakingDisabled}
                isLoading={isComposing || isSubmitting}
                onClick={onUnstakeClick}
                icon={isUnstakingDisabled ? 'info' : undefined}
            >
                <Translation id="TR_STAKE_UNSTAKE" />
            </Button>
        </Tooltip>
    );
};
