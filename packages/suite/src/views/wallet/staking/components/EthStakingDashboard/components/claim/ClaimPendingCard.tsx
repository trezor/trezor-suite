import styled, { useTheme } from 'styled-components';
import { Icon } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { FiatValueWrapper, FormattedCryptoAmountWrapper } from './styled';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { variables } from '@trezor/components/src/config';
import { borders, spacingsPx } from '@trezor/theme';

const StyledCard = styled.div`
    border-radius: ${borders.radii.md};
    padding: ${spacingsPx.sm} ${spacingsPx.xxl} ${spacingsPx.md};
    margin-bottom: ${spacingsPx.xs};
    background: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1};
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        display: block;
        position: absolute;
        left: 0;
        top: 0;
        width: 8px;
        height: 100%;
        background: ${({ theme }) => theme.backgroundPrimaryDefault};
    }
`;

const Flex = styled.div`
    display: flex;
    gap: ${spacingsPx.lg};
    align-items: center;
    flex-wrap: wrap;
`;

const Heading = styled.div`
    margin-bottom: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
    font-size: ${variables.FONT_SIZE.TINY};
`;

interface ClaimPendingCardProps {
    claimAmount: string;
}

export const ClaimPendingCard = ({ claimAmount }: ClaimPendingCardProps) => {
    const theme = useTheme();
    const { symbol } = useSelector(selectSelectedAccount) ?? {};
    const mappedSymbol = mapTestnetSymbol(symbol ?? 'eth');

    return (
        <StyledCard>
            <Flex>
                <Icon icon="SPINNER" size={40} color={theme.iconPrimaryDefault} />

                <div>
                    <Heading>
                        <Translation id="TR_STAKE_CLAIM_PENDING" />
                    </Heading>

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
            </Flex>
        </StyledCard>
    );
};
