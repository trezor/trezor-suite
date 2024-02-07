import { Meta, StoryObj } from '@storybook/react';
import { Card } from '../Card/Card';
import { Modal } from '../modals/Modal/Modal';
import styled from 'styled-components';
import { Textarea } from '../form/Textarea/Textarea';
import { useElevation } from './ElevationContext';
import { Elevation, mapElevationToBackground } from '@trezor/theme';
import { ReactNode } from 'react';

export default {
    title: 'Misc/ElevationContext',
} as Meta;

const Wrapper = styled.div`
    padding-bottom: 20px;
`;

const TextareaExtenderStyled = styled.div<{ elevation: Elevation }>`
    padding: 20px;
    border: 1px solid red;
    background-color: ${({ theme, elevation }) => theme[mapElevationToBackground({ elevation })]};
`;

const TextareaExtender = ({ children }: { children: ReactNode }) => {
    // It is important to do `useElevation` in separate component.
    // This way we get +1 elevation.
    // So in this case it will be 2 same as the Textarea that is passed as children here.
    const { elevation } = useElevation();

    return (
        <TextareaExtenderStyled elevation={elevation}>
            Extending area on elevation {elevation}
            {children}
        </TextareaExtenderStyled>
    );
};

export const ElevationContext: StoryObj = {
    render: () => (
        <>
            <Wrapper>
                <Card>
                    Elevation0
                    <Card>
                        Elevation 1
                        <Card>
                            Elevation 3
                            <Card>
                                Elevation 4
                                <Card>
                                    Elevation 5<Card>Elevation 6</Card>
                                </Card>
                            </Card>
                        </Card>
                    </Card>
                </Card>
            </Wrapper>

            <Wrapper>
                <Modal>
                    Modal content
                    <Card>Card inside of a Modal</Card>
                </Modal>
            </Wrapper>

            <Wrapper>
                <Card>
                    Card and Textarea inside it wrapped in the "extender" component with same
                    elevation as the Textarea has.
                    <TextareaExtender>
                        <Textarea>
                            "If you don’t believe it or don’t get it, I don’t have the time to try
                            to convince you, sorry." ― Satoshi Nakamoto
                        </Textarea>
                    </TextareaExtender>
                </Card>
            </Wrapper>
        </>
    ),
};
