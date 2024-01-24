import styled from 'styled-components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Button, Icon, P, variables } from '@trezor/components';
import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { FiatValueWrapper, FormattedCryptoAmountWrapper } from './styled';

const StyledCard = styled.div`
    border-radius: 16px;
    padding: 16px 30px 30px 16px;
    margin-bottom: 8px;

    background: linear-gradient(
        87deg,
        ${({ theme }) => theme.BG_LIGHT_GREEN} 0%,
        ${({ theme }) => theme.BG_WHITE} 73.33%
    );
    position: relative;
    overflow: hidden;
`;

const BgImgWrapper = styled.div<{ top: number; left: number }>`
    opacity: ${({ theme }) => (theme.THEME === 'dark' ? '0.5' : '0.1')};
    position: absolute;
    left: ${({ left = 0 }) => left}px;
    top: ${({ top = 30 }) => top}px;
`;

const Flex = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    row-gap: 12px;
`;

const InfoWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    column-gap: 50px;
    row-gap: 20px;
`;

const InfoHeading = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 8px;
`;

const StyledP = styled(P)`
    font-size: ${variables.FONT_SIZE.H2};
    line-height: normal;
`;

// TODO: Move to theme.
const iconColor = '#0F6148';

interface ClaimReadyCardProps {
    claimAmount: string;
}

export const ClaimReadyCard = ({ claimAmount }: ClaimReadyCardProps) => {
    const { symbol } = useSelector(selectSelectedAccount) ?? {};
    const mappedSymbol = mapTestnetSymbol(symbol ?? 'eth');
    const dispatch = useDispatch();
    const openClaimModal = () => {
        dispatch(openModal({ type: 'claim' }));
    };

    return (
        <StyledCard>
            <BgImgWrapper top={30} left={-8}>
                <Icon icon="PIGGY_BANK_FILLED" size={31} color={iconColor} />
            </BgImgWrapper>
            <BgImgWrapper top={93} left={126}>
                <Icon icon="CURRENCY_ETH" size={29} color={iconColor} />
            </BgImgWrapper>
            <BgImgWrapper top={90} left={273}>
                <Icon icon="MONEY" size={25} color={iconColor} />
            </BgImgWrapper>
            <BgImgWrapper top={-3} left={340}>
                <Icon icon="COIN_FILLED" size={31} color={iconColor} />
            </BgImgWrapper>

            <Flex>
                <InfoWrapper>
                    <div>
                        <InfoHeading>
                            <Icon icon="CHECKS" size={16} />
                            <Translation id="TR_STAKE_UNSTAKED_AND_READY_TO_CLAIM" />
                        </InfoHeading>

                        <FormattedCryptoAmountWrapper>
                            <FormattedCryptoAmount value={claimAmount} symbol={symbol} />
                        </FormattedCryptoAmountWrapper>

                        <FiatValueWrapper>
                            <FiatValue
                                showApproximationIndicator
                                amount={claimAmount}
                                symbol={mappedSymbol}
                            />
                        </FiatValueWrapper>
                    </div>
                    <div>
                        <InfoHeading>
                            <Icon icon="LIGHTNING" size={16} />
                            <Translation id="TR_STAKE_TIME_TO_CLAIM" />
                        </InfoHeading>

                        <StyledP weight="medium">
                            <Translation id="TR_STAKE_INSTANT" />
                        </StyledP>
                    </div>
                </InfoWrapper>

                <Button onClick={openClaimModal}>
                    <Translation id="TR_STAKE_CLAIM" />
                </Button>
            </Flex>
        </StyledCard>
    );
};
