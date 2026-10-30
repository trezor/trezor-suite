import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { ModalButton } from './ModalButton';
import { type AllowedButtonFrameProps, type ButtonProps } from '../buttons/Button/Button';

const BUTTON_MIN_WIDTH = 150;
const BUTTON_GAP = 8;

const Container = styled.div<{ $isStacked: boolean }>`
    display: flex;
    flex-direction: ${({ $isStacked }) => ($isStacked ? 'column' : 'row')};
    justify-content: flex-end;
    gap: 8px;
    width: 100%;
    min-width: 0;

    > button,
    > a {
        flex-shrink: 0;
    }
`;
function getNaturalButtonWidth(button: HTMLElement) {
    const { width, minWidth } = button.style;
    button.style.width = 'max-content';
    button.style.minWidth = `${BUTTON_MIN_WIDTH}px`;
    const naturalWidth = button.getBoundingClientRect().width;
    button.style.width = width;
    button.style.minWidth = minWidth;

    return naturalWidth;
}

type ActionProps = Omit<ButtonProps, keyof AllowedButtonFrameProps | 'priority'>;

export type ModalActionsProps = {
    primaryAction: ActionProps;
    secondaryAction?: ActionProps;
};

export const ModalActions = ({ primaryAction, secondaryAction }: ModalActionsProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isStacked, setIsStacked] = useState(false);
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const buttons = Array.from(container.children) as HTMLElement[];
        const updateLayout = () => {
            const requiredWidth =
                buttons.reduce((width, button) => width + getNaturalButtonWidth(button), 0) +
                (buttons.length - 1) * BUTTON_GAP;
            setIsStacked(container.getBoundingClientRect().width < requiredWidth);
        };
        const observer = new ResizeObserver(updateLayout);
        observer.observe(container);
        buttons.forEach(button => observer.observe(button));
        updateLayout();

        return () => observer.disconnect();
    }, [primaryAction, secondaryAction]);

    const primaryButton = (
        <ModalButton
            key="primary"
            {...primaryAction}
            priority="primary"
            width={isStacked ? '100%' : undefined}
            minWidth={isStacked ? 0 : BUTTON_MIN_WIDTH}
        />
    );
    const secondaryButton = secondaryAction && (
        <ModalButton
            key="secondary"
            intent="neutral"
            {...secondaryAction}
            priority="secondary"
            width={isStacked ? '100%' : undefined}
            minWidth={isStacked ? 0 : BUTTON_MIN_WIDTH}
        />
    );

    return (
        <Container ref={containerRef} $isStacked={isStacked} data-component="ModalActions">
            {isStacked ? [primaryButton, secondaryButton] : [secondaryButton, primaryButton]}
        </Container>
    );
};
