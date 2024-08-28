import { Button, Column, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import { FormFractionButtons } from 'src/components/suite/FormFractionButtons';
import { StakeFees } from './StakeFees';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';
import { Inputs } from './Inputs';
import { ConfirmStakeEthModal } from './ConfirmStakeEthModal';
import { AvailableBalance } from './AvailableBalance';

export const StakeEthForm = () => {
    const {
        account,
        network,
        formState: { isDirty },
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

    return (
        <>
            {isConfirmModalOpen && (
                <ConfirmStakeEthModal
                    isLoading={isLoading}
                    onConfirm={signTx}
                    onCancel={closeConfirmModal}
                />
            )}

            <Column gap={spacings.md} alignItems="stretch">
                <AvailableBalance formattedBalance={formattedBalance} symbol={symbol} />

                <Row justifyContent="space-between">
                    <FormFractionButtons
                        setRatioAmount={setRatioAmount}
                        setMax={setMax}
                        symbol={symbol}
                        totalAmount={account.formattedBalance}
                        decimals={network.decimals}
                    />

                    {(isDirty || hasValues) && (
                        <Button type="button" variant="tertiary" size="tiny" onClick={clearForm}>
                            <Translation id="TR_CLEAR_ALL" />
                        </Button>
                    )}
                </Row>

                <Inputs />

                <StakeFees />
            </Column>
        </>
    );
};
