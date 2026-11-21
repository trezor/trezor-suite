import { useState } from 'react';

import styled from 'styled-components';

import { Banner, Button, Card, Column, H3, Paragraph, Row } from '@trezor/components';

import {
    PIN_MATRIX_ROWS,
    appendPinPosition,
    isSubmittablePin,
    removeLastPinPosition,
} from '../device/pinMatrix';
import { WRONG_PIN_ATTEMPTS_BEFORE_WIPE } from '../firmware/firmwareSupport';

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 72px);
    gap: 8px;
`;

// A plain button, because every cell needs its own accessible name while looking the same.
const MatrixButton = styled.button`
    height: 56px;
    border: 1px solid ${({ theme }) => theme.elementBorderField};
    border-radius: 12px;
    background: ${({ theme }) => theme.elementFillNeutralSoft};
    color: ${({ theme }) => theme.contentPrimary};
    font-size: 20px;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.elementFillNeutralSoftHovered};
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.elementBorderFocusRing};
        outline-offset: 2px;
    }
`;

const PIN_DOT = '●';

type PinMatrixProps = {
    isWipedAfterWrongAttempts: boolean;
    onSubmit: (pin: string) => void;
    onCancel: () => void;
};

export const PinMatrix = ({ isWipedAfterWrongAttempts, onSubmit, onCancel }: PinMatrixProps) => {
    const [pin, setPin] = useState('');

    return (
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H3>Enter your PIN</H3>
                <Paragraph>
                    Look at the Trezor display. It shows the digits in a scrambled layout. Click the
                    positions here that match the digits of your PIN on the display.
                </Paragraph>
                <Banner
                    intent="warning"
                    description={
                        isWipedAfterWrongAttempts
                            ? `This Trezor erases itself after ${WRONG_PIN_ATTEMPTS_BEFORE_WIPE} wrong PIN attempts. This tool never retries a PIN on its own. If you are not sure about your PIN, stop here.`
                            : 'Every wrong PIN makes the Trezor wait longer before the next attempt. This tool never retries a PIN on its own.'
                    }
                />
                <Grid>
                    {PIN_MATRIX_ROWS.flat().map(position => (
                        <MatrixButton
                            key={position}
                            type="button"
                            aria-label={`Matrix position ${position}`}
                            onClick={() => setPin(current => appendPinPosition(current, position))}
                        >
                            {PIN_DOT}
                        </MatrixButton>
                    ))}
                </Grid>
                <Paragraph>
                    {pin.length > 0
                        ? `${PIN_DOT.repeat(pin.length)} (${pin.length} of at most 9)`
                        : 'No position entered yet'}
                </Paragraph>
                <Row gap={8}>
                    <Button isDisabled={!isSubmittablePin(pin)} onClick={() => onSubmit(pin)}>
                        Confirm PIN
                    </Button>
                    <Button
                        priority="secondary"
                        isDisabled={pin.length === 0}
                        onClick={() => setPin(removeLastPinPosition)}
                    >
                        Delete last
                    </Button>
                    <Button priority="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                </Row>
            </Column>
        </Card>
    );
};
