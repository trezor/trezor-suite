import styled from 'styled-components';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import { Row, commonFocusStyles } from '@trezor/components';
import { typography } from '@trezor/theme';

const Item = styled.button<{ $isSelected: boolean }>`
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    ${typography['headline-sm']}
    cursor: pointer;
    transition: 0.1s ease-in-out;
    background: ${({ $isSelected, theme }) =>
        $isSelected ? theme.elementFillContrast : theme.elementFillNeutralSoft};

    &:hover {
        background: ${({ $isSelected, theme }) =>
            $isSelected ? theme.elementFillContrastHovered : theme.elementFillNeutralSoftHovered};
    }

    &:focus-visible {
        ${commonFocusStyles}
    }
`;

export type EmojiRatingSelectorProps = {
    value: Rating | undefined;
    onChange: (rating: Rating) => void;
    'data-testid'?: string;
};

export const EmojiRatingSelector = ({
    value,
    onChange,
    'data-testid': dataTestId,
}: EmojiRatingSelectorProps) => (
    <Row gap={8} flexWrap="wrap" data-testid={dataTestId}>
        {ratingOptions.map(({ id, emoji }) => (
            <Item
                key={id}
                $isSelected={value === id}
                data-testid={dataTestId && `${dataTestId}/${id}`}
                onClick={() => onChange(id)}
                type="button"
            >
                {emoji}
            </Item>
        ))}
    </Row>
);
