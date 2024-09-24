import { Tooltip, Button } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';

export const UnstakeButton = () => {
    const { device, isLocked } = useDevice();
    const { isUnstakingDisabled, unstakingMessageContent } = useMessageSystemStaking();

    const {
        isComposing,
        formState: { isSubmitting, errors },
        handleSubmit,
        watch,
        signTx,
    } = useUnstakeEthFormContext();

    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || isLocked() || !device?.available;

    return (
        <Tooltip content={unstakingMessageContent}>
            <Button
                type="submit"
                isDisabled={isDisabled || isUnstakingDisabled}
                isLoading={isComposing || isSubmitting}
                onClick={handleSubmit(signTx)}
                icon={isUnstakingDisabled ? 'info' : undefined}
            >
                <Translation id="TR_STAKE_UNSTAKE" />
            </Button>
        </Tooltip>
    );
};
