import React from 'react';

import styled from 'styled-components';

import { Radio, Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { getAccountEverstakeStakingPool } from '@suite-common/wallet-utils';

import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useUnstakeEthFormContext } from 'src/hooks/wallet/useUnstakeEthForm';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import type { TranslationKey } from 'src/components/suite/Translation';

import { Inputs } from './Inputs';

const InputsWrapper = styled.div<{ $isShown: boolean }>`
    display: ${({ $isShown }) => ($isShown ? 'block' : 'none')};
`;

type RadioContentProps = {
    label: TranslationKey;
    cryptoAmount: string;
    rewardAmount?: string;
    fiatValueComponent?: React.ReactNode;
    symbol: NetworkSymbol;
};

const RadioContent = ({
    label,
    cryptoAmount,
    rewardAmount,
    fiatValueComponent,
    symbol,
}: RadioContentProps) => (
    <Row flex="1" justifyContent="space-between" gap={spacings.sm}>
        <Translation id={label} />
        <Column alignItems="flex-end">
            <Text variant="tertiary" typographyStyle="hint">
                <FormattedCryptoAmount value={cryptoAmount} symbol={symbol} />
            </Text>
            <Text typographyStyle="hint">
                {fiatValueComponent}
                {rewardAmount && (
                    <Text variant="primary">
                        <FiatValue amount={rewardAmount} symbol={symbol} />
                    </Text>
                )}
            </Text>
        </Column>
    </Row>
);

type OptionsProps = {
    symbol: NetworkSymbol;
};

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
        <Column alignItems="stretch" gap={spacings.sm}>
            <Column alignItems="stretch" gap={spacings.md} hasDivider>
                {new BigNumber(restakedReward).gt(0) && (
                    <Radio
                        isChecked={isRewardsSelected}
                        onClick={async () => {
                            if (isRewardsSelected) return;

                            setUnstakeOption('rewards');
                            await onOptionChange(restakedReward);
                        }}
                        verticalAlignment="center"
                    >
                        <RadioContent
                            label="TR_STAKE_ONLY_REWARDS"
                            cryptoAmount={restakedReward}
                            rewardAmount={restakedReward}
                            symbol={symbol}
                        />
                    </Radio>
                )}

                <Radio
                    isChecked={isAllSelected}
                    onClick={async () => {
                        if (isAllSelected) return;

                        setUnstakeOption('all');
                        await onOptionChange(autocompoundBalance);
                    }}
                    verticalAlignment="center"
                >
                    <RadioContent
                        label="TR_ALL"
                        cryptoAmount={autocompoundBalance}
                        rewardAmount={restakedReward}
                        fiatValueComponent={
                            <FiatValue amount={depositedBalance} symbol={symbol}>
                                {({ value }) => value && <span>{value} + </span>}
                            </FiatValue>
                        }
                        symbol={symbol}
                    />
                </Radio>

                <Radio
                    isChecked={isOtherAmountSelected}
                    onClick={() => {
                        if (isOtherAmountSelected) return;

                        setUnstakeOption('other');
                    }}
                    verticalAlignment="center"
                >
                    <RadioContent
                        label="TR_STAKE_OTHER_AMOUNT"
                        cryptoAmount={autocompoundBalance}
                        symbol={symbol}
                        fiatValueComponent={
                            <FiatValue amount={autocompoundBalance} symbol={symbol}>
                                {({ value }) =>
                                    value && (
                                        <>
                                            <Translation id="TR_UP_TO" /> {value}
                                        </>
                                    )
                                }
                            </FiatValue>
                        }
                    />
                </Radio>
            </Column>

            {/* CSS display property is used, as conditional rendering resets form state */}
            <InputsWrapper $isShown={isOtherAmountSelected}>
                <Inputs />
            </InputsWrapper>
        </Column>
    );
};
