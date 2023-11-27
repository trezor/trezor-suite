import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { Button } from '@trezor/components';

const Flex = styled.div`
    display: flex;
    gap: 4px;
`;

const SmallButton = styled(Button).attrs(props => ({
    ...props,
    variant: 'tertiary',
    type: 'button',
    size: 'small',
}))``;

interface FormFractionButtonsProps {
    setRatioAmount: (divisor: number) => void;
    setMax: () => void;
    isDisabled: boolean;
}

export const FormFractionButtons = ({
    setRatioAmount,
    setMax,
    isDisabled = false,
}: FormFractionButtonsProps) => (
    <Flex>
        <SmallButton isDisabled={isDisabled} onClick={() => setRatioAmount(10)}>
            10%
        </SmallButton>
        <SmallButton isDisabled={isDisabled} onClick={() => setRatioAmount(4)}>
            25%
        </SmallButton>
        <SmallButton isDisabled={isDisabled} onClick={() => setRatioAmount(2)}>
            50%
        </SmallButton>
        <SmallButton isDisabled={isDisabled} onClick={setMax}>
            <Translation id="TR_STAKE_MAX" />
        </SmallButton>
    </Flex>
);
