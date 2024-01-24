import { useState } from 'react';
import styled from 'styled-components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { P, RadioButton, variables } from '@trezor/components';
import { Inputs } from './Inputs';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { useStakeAndRewards } from 'src/hooks/wallet/useStakeAndRewards';

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

    const { stakeWithRewards, originalStake, rewards } = useStakeAndRewards();

    return (
        <div>
            <StyledRadioButton
                isChecked={isRewardsSelected}
                onClick={async () => {
                    if (isRewardsSelected) return;

                    setUnstakeOption('rewards');
                    await onOptionChange(rewards.toString());
                }}
            >
                <RadioButtonLabelContent>
                    <RadioButtonLabelTxt>
                        <Translation id="TR_STAKE_ONLY_REWARDS" />
                    </RadioButtonLabelTxt>

                    <TxtRight>
                        <P weight="medium">
                            <GreenTxt>
                                <FiatValue amount={rewards.toString()} symbol={mappedSymbol} />
                            </GreenTxt>
                        </P>
                        <GreyP size="small" weight="medium">
                            <FormattedCryptoAmount value={rewards.toString()} symbol={symbol} />
                        </GreyP>
                    </TxtRight>
                </RadioButtonLabelContent>
            </StyledRadioButton>

            <StyledRadioButton
                isChecked={isAllSelected}
                onClick={async () => {
                    if (isAllSelected) return;

                    setUnstakeOption('all');
                    await onOptionChange(stakeWithRewards.toString());
                }}
            >
                <RadioButtonLabelContent>
                    <RadioButtonLabelTxt>
                        <Translation id="TR_ALL" />
                    </RadioButtonLabelTxt>

                    <TxtRight>
                        <P weight="medium">
                            <FiatValue amount={originalStake.toString()} symbol={mappedSymbol} /> +{' '}
                            <GreenTxt>
                                <FiatValue amount={rewards.toString()} symbol={mappedSymbol} />
                            </GreenTxt>
                        </P>
                        <GreyP size="small" weight="medium">
                            <FormattedCryptoAmount
                                value={stakeWithRewards.toString()}
                                symbol={symbol}
                            />
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
                            <Translation id="TR_UP_TO" />{' '}
                            <FiatValue amount={stakeWithRewards.toString()} symbol={mappedSymbol} />
                        </P>
                        <GreyP size="small" weight="medium">
                            <FormattedCryptoAmount
                                value={stakeWithRewards.toString()}
                                symbol={symbol}
                            />
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
