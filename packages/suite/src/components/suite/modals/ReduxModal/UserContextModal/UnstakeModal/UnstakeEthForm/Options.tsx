import styled from 'styled-components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Paragraph, Radio } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { Inputs } from './Inputs';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { useSelector } from 'src/hooks/suite';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { getAccountEverstakeStakingPool } from '@suite-common/wallet-utils';

// eslint-disable-next-line local-rules/no-override-ds-component
const GreyP = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
`;

const RadioWrapper = styled.div`
    & > div {
        align-items: center;

        & > div:nth-of-type(2) {
            padding: 14px 0;
            margin-left: ${spacingsPx.xxs};
            border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
            flex: 1 0 auto;
        }
    }
`;

const RadioWrapperLast = styled(RadioWrapper)`
    & > div > div:nth-of-type(2) {
        border-bottom: none;
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

const InputsWrapper = styled.div<{ $isShown: boolean }>`
    width: 100%;
    margin-bottom: ${spacingsPx.sm};
    display: ${({ $isShown }) => ($isShown ? 'block' : 'none')};
`;

interface OptionsProps {
    symbol: NetworkSymbol;
}

export const Options = ({ symbol }: OptionsProps) => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const { unstakeOption, setUnstakeOption } = useUnstakeEthFormContext();

    const isRewardsSelected = unstakeOption === 'rewards';
    const isAllSelected = unstakeOption === 'all';
    const isOtherAmountSelected = unstakeOption === 'other';
    const { onOptionChange } = useUnstakeEthFormContext();

    const {
        autocompoundBalance = '0',
        depositedBalance = '0',
        restakedReward = '0',
    } = getAccountEverstakeStakingPool(selectedAccount) ?? {};

    return (
        <div>
            {new BigNumber(restakedReward).gt(0) && (
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
                                        <FiatValue amount={restakedReward} symbol={symbol} />
                                    </GreenTxt>
                                </Paragraph>
                            </TxtRight>
                        </RadioButtonLabelContent>
                    </Radio>
                </RadioWrapper>
            )}

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
                                <FiatValue amount={depositedBalance} symbol={symbol}>
                                    {({ value }) => value && <span>{value} + </span>}
                                </FiatValue>
                                <GreenTxt>
                                    <FiatValue amount={restakedReward} symbol={symbol} />
                                </GreenTxt>
                            </Paragraph>
                        </TxtRight>
                    </RadioButtonLabelContent>
                </Radio>
            </RadioWrapper>

            <RadioWrapperLast>
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
                                <FiatValue amount={autocompoundBalance} symbol={symbol}>
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
            </RadioWrapperLast>

            {/* CSS display property is used, as conditional rendering resets form state */}
            <InputsWrapper $isShown={isOtherAmountSelected}>
                <Inputs />
            </InputsWrapper>
        </div>
    );
};
