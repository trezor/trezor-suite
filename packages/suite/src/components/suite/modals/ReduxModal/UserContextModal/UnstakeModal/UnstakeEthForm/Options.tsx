import { useState } from 'react';
import styled from 'styled-components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Paragraph, Radio } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Inputs } from './Inputs';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { mapTestnetSymbol } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useSelector } from 'src/hooks/suite';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectSelectedAccountEverstakeStakingPool } from 'src/reducers/wallet/selectedAccountReducer';

const GreyP = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
`;

const RadioWrapper = styled.div`
    & > div {
        align-items: center;

        & > div:nth-of-type(2) {
            padding: 14px 0;
            margin-left: ${spacingsPx.xxs};
            border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};
            flex: 1 0 auto;
        }
    }

    &:nth-of-type(3) {
        & > div > div:nth-of-type(2) {
            border-bottom: none;
        }
    }
`;

const RadioButtonLabelContent = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1 0 auto;
`;

const RadioButtonLabelTxt = styled.div`
    color: ${({ theme }) => theme.textDefault};
`;

const TxtRight = styled.div`
    text-align: right;
`;

const GreenTxt = styled.span`
    color: ${({ theme }) => theme.textPrimaryDefault};
`;

const InputsWrapper = styled.div<{ isShown: boolean }>`
    max-width: 442px;
    margin-left: auto;
    margin-bottom: ${spacingsPx.sm};
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
            <RadioWrapper>
                <Radio
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
                            <GreyP>
                                <FormattedCryptoAmount value={restakedReward} symbol={symbol} />
                            </GreyP>
                            <Paragraph>
                                <GreenTxt>
                                    <FiatValue amount={restakedReward} symbol={mappedSymbol} />
                                </GreenTxt>
                            </Paragraph>
                        </TxtRight>
                    </RadioButtonLabelContent>
                </Radio>
            </RadioWrapper>

            <RadioWrapper>
                <Radio
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
                            <GreyP>
                                <FormattedCryptoAmount
                                    value={autocompoundBalance}
                                    symbol={symbol}
                                />
                            </GreyP>
                            <Paragraph>
                                <FiatValue amount={depositedBalance} symbol={mappedSymbol}>
                                    {({ value }) => value && <span>{value} + </span>}
                                </FiatValue>
                                <GreenTxt>
                                    <FiatValue amount={restakedReward} symbol={mappedSymbol} />
                                </GreenTxt>
                            </Paragraph>
                        </TxtRight>
                    </RadioButtonLabelContent>
                </Radio>
            </RadioWrapper>

            <RadioWrapper>
                <Radio
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
                            <GreyP>
                                <FormattedCryptoAmount
                                    value={autocompoundBalance}
                                    symbol={symbol}
                                />
                            </GreyP>
                            <Paragraph>
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
                            </Paragraph>
                        </TxtRight>
                    </RadioButtonLabelContent>
                </Radio>
            </RadioWrapper>

            {/* CSS display property is used, as conditional rendering resets form state */}
            <InputsWrapper isShown={isOtherAmountSelected}>
                <Inputs />
            </InputsWrapper>
        </div>
    );
};
