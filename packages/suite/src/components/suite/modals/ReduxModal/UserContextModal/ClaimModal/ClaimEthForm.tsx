import { useEffect } from 'react';
import styled from 'styled-components';
import { Button, P, variables, Warning } from '@trezor/components';
import { Translation, FiatValue, FormattedCryptoAmount } from 'src/components/suite';
import { UNSTAKED_ETH } from 'src/constants/suite/ethStaking';
import { FeesInfo } from 'src/components/wallet/FeesInfo';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useClaimEthFormContext } from 'src/hooks/wallet/useClaimEthForm';
import { CRYPTO_INPUT } from 'src/types/wallet/stakeForms';

const AmountInfo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 16px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TxtRight = styled.div`
    text-align: right;
`;

const GreenTxt = styled.span`
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledWarning = styled(Warning)`
    margin-top: 12px;
    color: ${({ theme }) => theme.TYPE_RED};
    justify-content: flex-start;
`;

const ClaimingPeriodWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 18px 0 14px;
    margin-top: 26px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const GreyP = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const ClaimEthForm = () => {
    const {
        account: { symbol },
        formState: { errors, isSubmitting },
        composedLevels,
        selectedFee,
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
    const transactionInfo = composedLevels?.[selectedFee];

    // TODO: Replace with real data.
    const claimingPeriod = 'in the next block';

    useEffect(() => {
        onClaimChange(UNSTAKED_ETH.toString());
    }, [onClaimChange]);

    return (
        <form onSubmit={handleSubmit(signTx)}>
            <AmountInfo>
                <Translation id="AMOUNT" />

                <TxtRight>
                    <P weight="medium">
                        <GreenTxt>
                            <FiatValue amount={UNSTAKED_ETH.toString()} symbol={mappedSymbol} />
                        </GreenTxt>
                    </P>
                    <GreyP size="small" weight="medium">
                        <FormattedCryptoAmount value={UNSTAKED_ETH.toString()} symbol={symbol} />
                    </GreyP>
                </TxtRight>
            </AmountInfo>

            <FeesInfo
                transactionInfo={transactionInfo}
                symbol={symbol}
                helperText={<Translation id="TR_STAKE_PAID_FROM_BALANCE" />}
            />

            {errors[CRYPTO_INPUT]?.type === 'compose' && (
                <StyledWarning variant="critical">
                    <Translation id="TR_NOT_ENOUGH_FUNDS_FOR_TX" />
                </StyledWarning>
            )}

            <ClaimingPeriodWrapper>
                <GreyP weight="medium">
                    <Translation id="TR_STAKE_CLAIMING_PERIOD" />
                </GreyP>

                <div>{claimingPeriod}</div>
            </ClaimingPeriodWrapper>

            <Button
                type="submit"
                fullWidth
                isDisabled={!(formIsValid && hasValues) || isSubmitting}
                isLoading={isComposing || isSubmitting}
                onClick={handleSubmit(signTx)}
            >
                <Translation id="TR_STAKE_CLAIM" />
            </Button>
        </form>
    );
};
