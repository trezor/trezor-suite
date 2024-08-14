import { Icon } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { Fragment } from 'react';
import { Translation } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import styled, { useTheme } from 'styled-components';

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${spacingsPx.lg} ${spacingsPx.xl};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
`;

const Step = styled.div<{
    $active: boolean;
}>`
    display: flex;
    flex: 1;
    justify-content: center;
    ${typography.body}
    color: ${({ $active, theme }) => ($active ? theme.textPrimaryDefault : theme.textSubdued)};
`;

const StepWrap = styled.div`
    display: flex;
    flex: 1;
`;

const Arrow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin: 0 ${spacingsPx.xl};
`;

export interface CoinmarketSelectedOfferStepperItemProps {
    step: string;
    translationId: ExtendedMessageDescriptor['id'];
    isActive: boolean;
    component: JSX.Element | null;
}

interface CoinmarketSelectedOfferStepperProps {
    steps: CoinmarketSelectedOfferStepperItemProps[];
}

export const CoinmarketSelectedOfferStepper = ({ steps }: CoinmarketSelectedOfferStepperProps) => {
    const theme = useTheme();

    return (
        <Header>
            {steps.map((step, index) => (
                <Fragment key={index}>
                    <StepWrap>
                        <Step $active={step.isActive}>
                            <Translation id={step.translationId} />
                        </Step>
                    </StepWrap>
                    {index < steps.length - 1 && (
                        <Arrow>
                            <Icon name="chevronRight" color={theme.iconSubdued} />
                        </Arrow>
                    )}
                </Fragment>
            ))}
        </Header>
    );
};
