import { useState } from 'react';
import styled from 'styled-components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { P, RadioButton, variables } from '@trezor/components';
import { Inputs } from './Inputs';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useSelector } from 'src/hooks/suite';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectSelectedAccountEverstakeStakingPool } from 'src/reducers/wallet/selectedAccountReducer';

// Extract?
const GreyP = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledRadioButton = styled(RadioButton)`
    align-items: center;

    & > div:nth-child(2) {
        padding: 14px 0;
        margin-left: 12px;
        border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
        flex: 1 0 auto;
    }

    &:nth-child(3) {
        & > div:nth-child(2) {
            border-bottom: none;
        }
    }
`;

const RadioButtonLabelContent = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1 0 auto;
`;

const RadioButtonLabelTxt = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const TxtRight = styled.div`
    text-align: right;
`;

const GreenTxt = styled.span`
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const InputsWrapper = styled.div<{ isShown: boolean }>`
    max-width: 410px;
    margin-left: auto;
    margin-bottom: 12px;
    display: ${({ isShown }) => (isShown ? 'block' : 'none')};
`;

type UnstakeOptions = 'all' | 'rewards' | 'other';

interface OptionsProps {
    symbol: NetworkSymbol;
}

export const Options = ({ symbol }: OptionsProps) => {
    const [unstakeOption, setUnstakeOption] = useState<UnstakeOptions>('other');
    const isRewardsSelected = unstakeOption === 'rewards';
    const isAllSelected = unstakeOption === 'all';
    const isOtherAmountSelected = unstakeOption === 'other';
    const mappedSymbol = mapTestnetSymbol(symbol);
    const { onOptionChange } = useUnstakeEthFormContext();

    const {
        autocompoundBalance = '0',
        depositedBalance = '0',
        restakedReward = '0',
    } = useSelector(selectSelectedAccountEverstakeStakingPool) ?? {};

    return (
        <div>
            <StyledRadioButton
                isChecked={isRewardsSelected}
                onClick={async () => {
                    if (isRewardsSelected) return;

                    setUnstakeOption('rewards');
                    await onOptionChange(restakedReward);
                }}
            >
                <RadioButtonLabelContent>
                    <RadioButtonLabelTxt>
                        <Translation id="TR_STAKE_ONLY_REWARDS" />
                    </RadioButtonLabelTxt>

                    <TxtRight>
                        <P weight="medium">
                            <GreenTxt>
                                <FiatValue amount={restakedReward} symbol={mappedSymbol} />
                            </GreenTxt>
                        </P>
                        <GreyP size="small" weight="medium">
                            <FormattedCryptoAmount value={restakedReward} symbol={symbol} />
                        </GreyP>
                    </TxtRight>
                </RadioButtonLabelContent>
            </StyledRadioButton>

            <StyledRadioButton
                isChecked={isAllSelected}
                onClick={async () => {
                    if (isAllSelected) return;

                    setUnstakeOption('all');
                    await onOptionChange(autocompoundBalance);
                }}
            >
                <RadioButtonLabelContent>
                    <RadioButtonLabelTxt>
                        <Translation id="TR_ALL" />
                    </RadioButtonLabelTxt>

                    <TxtRight>
                        <P weight="medium">
                            <FiatValue amount={depositedBalance} symbol={mappedSymbol}>
                                {({ value }) => value && <span>{value} + </span>}
                            </FiatValue>
                            <GreenTxt>
                                <FiatValue amount={restakedReward} symbol={mappedSymbol} />
                            </GreenTxt>
                        </P>
                        <GreyP size="small" weight="medium">
                            <FormattedCryptoAmount value={autocompoundBalance} symbol={symbol} />
                        </GreyP>
                    </TxtRight>
                </RadioButtonLabelContent>
            </StyledRadioButton>

            <StyledRadioButton
                isChecked={isOtherAmountSelected}
                onClick={() => {
                    if (isOtherAmountSelected) return;

                    setUnstakeOption('other');
                }}
            >
                <RadioButtonLabelContent>
                    <RadioButtonLabelTxt>
                        <Translation id="TR_STAKE_OTHER_AMOUNT" />
                    </RadioButtonLabelTxt>

                    <TxtRight>
                        <P weight="medium">
                            <FiatValue amount={autocompoundBalance} symbol={mappedSymbol}>
                                {({ value }) =>
                                    value && (
                                        <>
                                            {' '}
                                            <Translation id="TR_UP_TO" /> {value}
                                        </>
                                    )
                                }
                            </FiatValue>
                        </P>
                        <GreyP size="small" weight="medium">
                            <FormattedCryptoAmount value={autocompoundBalance} symbol={symbol} />
                        </GreyP>
                    </TxtRight>
                </RadioButtonLabelContent>
            </StyledRadioButton>

            {/* CSS display property is used, as conditional rendering resets form state */}
            <InputsWrapper isShown={isOtherAmountSelected}>
                <Inputs />
            </InputsWrapper>
        </div>
    );
};
