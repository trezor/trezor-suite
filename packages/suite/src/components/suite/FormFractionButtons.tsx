import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { Button, Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_STAKING,
} from 'src/constants/suite/ethStaking';
import { NetworkSymbol } from '@suite-common/wallet-config';

const Flex = styled.div`
    display: flex;
    gap: 4px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const TinyButton = styled(Button).attrs(props => ({
    ...props,
    variant: 'tertiary',
    type: 'button',
    size: 'tiny',
}))``;

interface FormFractionButtonsProps {
    setRatioAmount: (divisor: number) => void;
    setMax: () => void;
    isDisabled?: boolean;
    symbol: NetworkSymbol;
    totalAmount?: number | string;
    decimals?: number;
}

export const FormFractionButtons = ({
    setRatioAmount,
    setMax,
    isDisabled = false,
    symbol,
    totalAmount,
    decimals,
}: FormFractionButtonsProps) => {
    const isFractionButtonDisabled = (divisor: number) => {
        if (!totalAmount || !decimals) return false;

        return new BigNumber(totalAmount)
            .dividedBy(divisor)
            .decimalPlaces(decimals)
            .lte(MIN_ETH_AMOUNT_FOR_STAKING);
    };
    const is10PercentDisabled = isDisabled || isFractionButtonDisabled(10);
    const is25PercentDisabled = isDisabled || isFractionButtonDisabled(4);
    const is50PercentDisabled = isDisabled || isFractionButtonDisabled(2);
    const isMaxDisabled =
        isDisabled || new BigNumber(totalAmount || '0').lt(MIN_ETH_BALANCE_FOR_STAKING);

    return (
        <Flex>
            <Tooltip
                content={
                    <Translation
                        id="TR_STAKE_MIN_AMOUNT_TOOLTIP"
                        values={{
                            amount: MIN_ETH_AMOUNT_FOR_STAKING.toString(),
                            symbol: symbol.toUpperCase(),
                        }}
                    />
                }
                cursor="pointer"
                disabled={!is10PercentDisabled}
            >
                <TinyButton isDisabled={is10PercentDisabled} onClick={() => setRatioAmount(10)}>
                    10%
                </TinyButton>
            </Tooltip>
            <Tooltip
                content={
                    <Translation
                        id="TR_STAKE_MIN_AMOUNT_TOOLTIP"
                        values={{
                            amount: MIN_ETH_AMOUNT_FOR_STAKING.toString(),
                            symbol: symbol.toUpperCase(),
                        }}
                    />
                }
                cursor="pointer"
                disabled={!is25PercentDisabled}
            >
                <TinyButton isDisabled={is25PercentDisabled} onClick={() => setRatioAmount(4)}>
                    25%
                </TinyButton>
            </Tooltip>
            <Tooltip
                content={
                    <Translation
                        id="TR_STAKE_MIN_AMOUNT_TOOLTIP"
                        values={{
                            amount: MIN_ETH_AMOUNT_FOR_STAKING.toString(),
                            symbol: symbol.toUpperCase(),
                        }}
                    />
                }
                cursor="pointer"
                disabled={!is50PercentDisabled}
            >
                <TinyButton isDisabled={is50PercentDisabled} onClick={() => setRatioAmount(2)}>
                    50%
                </TinyButton>
            </Tooltip>
            <Tooltip
                content={
                    <Translation
                        id="TR_STAKE_MIN_AMOUNT_TOOLTIP"
                        values={{
                            amount: MIN_ETH_AMOUNT_FOR_STAKING.toString(),
                            symbol: symbol.toUpperCase(),
                        }}
                    />
                }
                cursor="pointer"
                disabled={!is50PercentDisabled}
            >
                <TinyButton isDisabled={isDisabled || isMaxDisabled} onClick={setMax}>
                    <Translation id="TR_STAKE_MAX" />
                </TinyButton>
            </Tooltip>
        </Flex>
    );
};
