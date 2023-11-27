import styled from 'styled-components';
import { H3, Icon, P, Tooltip, variables } from '@trezor/components';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, FiatValue, Translation } from 'src/components/suite';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const Flex = styled.div`
    display: flex;
    justify-content: space-between;
    min-height: 44px;
`;

const StyledH3 = styled(H3)`
    font-size: ${variables.FONT_SIZE.NORMAL};
    line-height: normal;
`;

const StyledH3Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const Right = styled.div`
    text-align: right;
`;

const GreyP = styled(P)`
    margin-top: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const Fees = () => {
    const {
        account: { symbol },
        composedLevels,
        selectedFee,
    } = useStakeEthFormContext();
    const transactionInfo = composedLevels?.[selectedFee];
    const isFeeShown = transactionInfo !== undefined && transactionInfo.type !== 'error';
    const symbolForFiat = mapTestnetSymbol(symbol);

    return (
        <Flex>
            <div>
                <StyledH3Wrapper>
                    <StyledH3 fontWeight={600}>
                        <Translation id="MAX_FEE" />
                    </StyledH3>

                    <Tooltip maxWidth={328} content={<Translation id="TR_STAKE_MAX_FEE_DESC" />}>
                        {/* TODO: Add new info icon. Export from Figma isn't handled as is it should by the strokes to fills online converter */}
                        <Icon icon="INFO" size={14} />
                    </Tooltip>
                </StyledH3Wrapper>
            </div>

            <Right>
                {isFeeShown && (
                    <>
                        <P weight="medium">
                            <FormattedCryptoAmount
                                disableHiddenPlaceholder
                                value={formatNetworkAmount(transactionInfo.fee, symbolForFiat)}
                                symbol={symbolForFiat}
                            />
                        </P>
                        <GreyP size="small" weight="medium">
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={formatNetworkAmount(transactionInfo.fee, symbolForFiat)}
                                symbol={symbolForFiat}
                            />
                        </GreyP>
                    </>
                )}
            </Right>
        </Flex>
    );
};
