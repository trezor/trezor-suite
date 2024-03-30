import styled from 'styled-components';
import { Button } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import { useDevice } from 'src/hooks/suite';
import { FormFractionButtons } from 'src/components/suite/FormFractionButtons';
import StakeFees from './Fees';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { Inputs } from './Inputs';
import { ConfirmStakeEthModal } from './ConfirmStakeEthModal';
import { AvailableBalance } from '../AvailableBalance';

const Body = styled.div`
    margin-bottom: ${spacingsPx.xl};
`;

const InputsWrapper = styled.div`
    margin-top: ${spacingsPx.md};
    margin-bottom: ${spacingsPx.xl};
`;

const ButtonsWrapper = styled.div`
    margin-top: ${spacingsPx.sm};
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const StakeEthForm = () => {
    const { device, isLocked } = useDevice();
    const {
        account,
        network,
        onSubmit,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty },
        isComposing,
        setRatioAmount,
        setMax,
        watch,
        clearForm,
        isConfirmModalOpen,
        closeConfirmModal,
        signTx,
        isLoading,
    } = useStakeEthFormContext();
    const { formattedBalance, symbol } = account;
    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;
    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || isLocked() || !device?.available;

    return (
        <>
            {isConfirmModalOpen && (
                <ConfirmStakeEthModal
                    isLoading={isLoading}
                    onConfirm={signTx}
                    onCancel={closeConfirmModal}
                />
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <Body>
                    <AvailableBalance formattedBalance={formattedBalance} symbol={symbol} />

                    <ButtonsWrapper>
                        <FormFractionButtons
                            setRatioAmount={setRatioAmount}
                            setMax={setMax}
                            symbol={symbol}
                            totalAmount={account.formattedBalance}
                            decimals={network.decimals}
                        />

                        {(isDirty || hasValues) && (
                            <Button
                                type="button"
                                variant="tertiary"
                                size="tiny"
                                onClick={clearForm}
                            >
                                <Translation id="TR_CLEAR_ALL" />
                            </Button>
                        )}
                    </ButtonsWrapper>

                    <InputsWrapper>
                        <Inputs />
                    </InputsWrapper>

                    <StakeFees />
                </Body>

                <Button
                    isFullWidth
                    isDisabled={isDisabled}
                    isLoading={isComposing || isSubmitting}
                    onClick={handleSubmit(onSubmit)}
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
            </form>
        </>
    );
};
