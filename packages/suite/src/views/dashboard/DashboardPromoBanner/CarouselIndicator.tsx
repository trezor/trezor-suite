import styled, { css } from 'styled-components';

import { Row, commonFocusStyles } from '@trezor/components';
import { borders } from '@trezor/theme';

const Pill = styled.button<{ $isActive: boolean }>`
    width: 30px;
    height: 12px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: ${borders.radii.full};

    &::before {
        content: '';
        display: block;
        width: 100%;
        height: 4px;
        border-radius: ${borders.radii.full};
        background: ${({ theme }) => theme.elementBorderField};
        transition:
            background-color 0.2s ease,
            opacity 0.2s ease;
    }

    &:hover::before {
        opacity: 0.8;
    }

    &:focus-visible {
        ${commonFocusStyles}
    }

    ${({ $isActive, theme }) =>
        $isActive &&
        css`
            &::before {
                background: ${theme.contentNeutral};
            }
        `}
`;

type CarouselIndicatorProps = {
    count: number;
    activeIndex: number;
    onSelect: (index: number) => void;
};

export const CarouselIndicator = ({ count, activeIndex, onSelect }: CarouselIndicatorProps) => (
    <Row gap={4} data-testid="@dashboard/promo-banner/carousel-indicator">
        {Array.from({ length: count }).map((_, index) => (
            <Pill
                key={index}
                type="button"
                $isActive={index === activeIndex}
                onClick={() => onSelect(index)}
                aria-label={`Show promo banner ${index + 1} of ${count}`}
                aria-current={index === activeIndex ? 'page' : undefined}
            />
        ))}
    </Row>
);
