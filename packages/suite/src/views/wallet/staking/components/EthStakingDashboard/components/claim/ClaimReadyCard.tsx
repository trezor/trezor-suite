import styled, { useTheme } from 'styled-components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Button, Icon, Paragraph, Tooltip, variables } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';
import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { FiatValueWrapper, FormattedCryptoAmountWrapper } from './styled';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

const StyledCard = styled.div`
    border-radius: ${borders.radii.md};
    padding: ${spacingsPx.md} ${spacingsPx.xxl} ${spacingsPx.xxl} ${spacingsPx.md};
    margin-bottom: ${spacingsPx.xs};

    background: linear-gradient(
        87deg,
        ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1} 0%,
        ${({ theme }) => theme.backgroundNeutralBoldInverted} 73.33%
    );
    position: relative;
    overflow: hidden;
`;

const StyledIcon = styled(Icon)`
    transform: rotate(20deg);
`;

const BgImgWrapper = styled.div<{ $top: number; $left: number }>`
    opacity: ${({ theme }) => (theme.legacy.THEME === 'dark' ? '0.5' : '0.1')};
    position: absolute;
    left: ${({ $left = 0 }) => $left}px;
    top: ${({ $top = 30 }) => $top}px;
`;

const Flex = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    row-gap: ${spacingsPx.sm};
`;

const InfoWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${spacingsPx.lg} 50px;
`;

const InfoHeading = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
    font-size: ${variables.FONT_SIZE.TINY};
    margin-bottom: ${spacingsPx.sm};
`;

const StyledP = styled(Paragraph)`
    font-size: ${variables.FONT_SIZE.H2};
    line-height: 24px;
`;

interface ClaimReadyCardProps {
    claimAmount: string;
}

export const ClaimReadyCard = ({ claimAmount }: ClaimReadyCardProps) => {
    const theme = useTheme();
    const { symbol } = useSelector(selectSelectedAccount) ?? {};
    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking();

    const dispatch = useDispatch();
    const openClaimModal = () => {
        if (!isClaimingDisabled) {
            dispatch(openModal({ type: 'claim' }));
        }
    };

    if (!symbol) {
        return null;
    }

    return (
        <StyledCard>
            <BgImgWrapper $top={30} $left={-16}>
                <StyledIcon name="piggyBankFilled" size={31} color={theme.iconPrimaryDefault} />
            </BgImgWrapper>
            <BgImgWrapper $top={103} $left={126}>
                <Icon name="currencyEth" size={29} color={theme.iconPrimaryDefault} />
            </BgImgWrapper>
            <BgImgWrapper $top={103} $left={273}>
                <Icon name="money" size={25} color={theme.iconPrimaryDefault} />
            </BgImgWrapper>
            <BgImgWrapper $top={-3} $left={340}>
                <Icon name="coinFilled" size={31} color={theme.iconPrimaryDefault} />
            </BgImgWrapper>

            <Flex>
                <InfoWrapper>
                    <div>
                        <InfoHeading>
                            <Icon name="confirmation" size={16} />
                            <Translation id="TR_STAKE_UNSTAKED_AND_READY_TO_CLAIM" />
                        </InfoHeading>

                        <FormattedCryptoAmountWrapper>
                            <FormattedCryptoAmount value={claimAmount} symbol={symbol} />
                        </FormattedCryptoAmountWrapper>

                        <FiatValueWrapper>
                            <FiatValue
                                showApproximationIndicator
                                amount={claimAmount}
                                symbol={symbol}
                            />
                        </FiatValueWrapper>
                    </div>
                    <div>
                        <InfoHeading>
                            <Icon name="lightning" size={16} />
                            <Translation id="TR_STAKE_TIME_TO_CLAIM" />
                        </InfoHeading>

                        <StyledP>
                            <Translation id="TR_STAKE_INSTANT" />
                        </StyledP>
                    </div>
                </InfoWrapper>

                <Tooltip content={claimingMessageContent}>
                    <Button
                        onClick={openClaimModal}
                        isDisabled={isClaimingDisabled}
                        icon={isClaimingDisabled ? 'info' : undefined}
                    >
                        <Translation id="TR_STAKE_CLAIM" />
                    </Button>
                </Tooltip>
            </Flex>
        </StyledCard>
    );
};
