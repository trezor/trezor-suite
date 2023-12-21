import styled from 'styled-components';
import { Image } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { UNSTAKED_ETH } from 'src/constants/suite/ethStaking';
import { FiatValueWrapper, FormattedCryptoAmountWrapper } from './styled';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { variables } from '@trezor/components/src/config';

const StyledCard = styled.div`
    border-radius: 16px;
    padding: 12px 28px 14px;
    margin-bottom: 8px;
    background: ${({ theme }) => theme.BG_LIGHT_GREEN};
    position: relative;
    overflow: hidden;

    &:before {
        content: '';
        display: block;
        position: absolute;
        left: 0;
        top: 0;
        width: 8px;
        height: 100%;
        background: ${({ theme }) => theme.TYPE_GREEN};
    }
`;

const Flex = styled.div`
    display: flex;
    gap: 18px;
    align-items: center;
    flex-wrap: wrap;
`;

const Heading = styled.div`
    margin-bottom: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const ClaimPendingCard = () => {
    const { symbol } = useSelector(selectSelectedAccount) ?? {};
    const mappedSymbol = mapTestnetSymbol(symbol ?? 'eth');

    return (
        <StyledCard>
            <Flex>
                <Image width={40} height={40} image="SPINNER" />

                <div>
                    <Heading>
                        <Translation id="TR_STAKE_CLAIM_PENDING" />
                    </Heading>

                    <FormattedCryptoAmountWrapper>
                        <FormattedCryptoAmount value={UNSTAKED_ETH.toString()} symbol={symbol} />
                    </FormattedCryptoAmountWrapper>

                    <FiatValueWrapper>
                        <FiatValue
                            showApproximationIndicator
                            amount={UNSTAKED_ETH.toString()}
                            symbol={mappedSymbol}
                        />
                    </FiatValueWrapper>
                </div>
            </Flex>
        </StyledCard>
    );
};
