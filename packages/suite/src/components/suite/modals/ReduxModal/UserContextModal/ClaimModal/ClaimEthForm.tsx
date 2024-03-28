import { useEffect } from 'react';
import styled from 'styled-components';
import { Button, Paragraph, Warning } from '@trezor/components';
import { Translation, FiatValue, FormattedCryptoAmount } from 'src/components/suite';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useDevice, useSelector } from 'src/hooks/suite';
import { useClaimEthFormContext } from 'src/hooks/wallet/useClaimEthForm';
import { selectSelectedAccountEverstakeStakingPool } from 'src/reducers/wallet/selectedAccountReducer';
import { CRYPTO_INPUT } from 'src/types/wallet/stakeForms';
import { spacingsPx } from '@trezor/theme';
import ClaimFees from './Fees';

const AmountInfo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: ${spacingsPx.md};
`;

const TxtRight = styled.div`
    text-align: right;
`;

const GreenTxt = styled.span`
    color: ${({ theme }) => theme.textPrimaryDefault};
`;

const StyledWarning = styled(Warning)`
    margin: ${spacingsPx.sm} 0 ${spacingsPx.sm} 0;
    justify-content: flex-start;
`;

const ClaimingPeriodWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding: ${spacingsPx.lg} 0 ${spacingsPx.md};
    margin-top: ${spacingsPx.xl};
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};
`;

const GreyP = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
`;

export const ClaimEthForm = () => {
    const { device, isLocked } = useDevice();
    const {
        account: { symbol },
        formState: { errors, isSubmitting },
        watch,
        isComposing,
        handleSubmit,
        onClaimChange,
        signTx,
    } = useClaimEthFormContext();
    const mappedSymbol = mapTestnetSymbol(symbol);
    const hasValues = Boolean(watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;
    const { claimableAmount = '0' } = useSelector(selectSelectedAccountEverstakeStakingPool) ?? {};
    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || isLocked() || !device?.available;

    useEffect(() => {
        onClaimChange(claimableAmount);
    }, [onClaimChange, claimableAmount]);

    return (
        <form onSubmit={handleSubmit(signTx)}>
            <AmountInfo>
                <Translation id="AMOUNT" />

                <TxtRight>
                    <GreyP>
                        <FormattedCryptoAmount value={claimableAmount} symbol={symbol} />
                    </GreyP>
                    <Paragraph>
                        <GreenTxt>
                            <FiatValue amount={claimableAmount} symbol={mappedSymbol} />
                        </GreenTxt>
                    </Paragraph>
                </TxtRight>
            </AmountInfo>

            {errors[CRYPTO_INPUT] && (
                <StyledWarning variant="destructive">{errors[CRYPTO_INPUT]?.message}</StyledWarning>
            )}

            <ClaimFees />

            <ClaimingPeriodWrapper>
                <GreyP>
                    <Translation id="TR_STAKE_CLAIMING_PERIOD" />
                </GreyP>

                <Translation id="TR_STAKE_CLAIM_IN_NEXT_BLOCK" />
            </ClaimingPeriodWrapper>

            <Button
                type="submit"
                isFullWidth
                isDisabled={isDisabled}
                isLoading={isComposing || isSubmitting}
                onClick={handleSubmit(signTx)}
            >
                <Translation id="TR_STAKE_CLAIM" />
            </Button>
        </form>
    );
};
