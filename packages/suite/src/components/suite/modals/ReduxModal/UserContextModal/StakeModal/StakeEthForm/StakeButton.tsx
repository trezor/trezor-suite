import { Tooltip, NewModal } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import { useDevice } from 'src/hooks/suite';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

export const StakeButton = () => {
    const { device, isLocked } = useDevice();
    const {
        onSubmit,
        handleSubmit,
        formState: { errors, isSubmitting },
        isComposing,
        watch,
    } = useStakeEthFormContext();
    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking();

    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;
    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || isLocked() || !device?.available;

    return (
        <Tooltip content={stakingMessageContent}>
            <NewModal.Button
                isFullWidth
                isDisabled={isDisabled || isStakingDisabled}
                isLoading={isComposing || isSubmitting}
                onClick={handleSubmit(onSubmit)}
                icon={isStakingDisabled ? 'info' : undefined}
            >
                <Translation id="TR_CONTINUE" />
            </NewModal.Button>
        </Tooltip>
    );
};
