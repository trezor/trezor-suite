import styled from 'styled-components';

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
    transition:
        background 0.1s ease-in-out,
        outline 0.1s ease-in-out,
        outline-offset 0.1s ease-in-out;
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

export type EmojiRatingSelectorOption<TValue extends string> = {
    id: TValue;
    emoji: string;
};

export type EmojiRatingSelectorProps<TValue extends string> = {
    value: TValue | undefined;
    options: ReadonlyArray<EmojiRatingSelectorOption<TValue>>;
    onChange: (value: TValue) => void;
    'data-testid'?: string;
};

export const EmojiRatingSelector = <TValue extends string>({
    value,
    options,
    onChange,
    'data-testid': dataTestId,
}: EmojiRatingSelectorProps<TValue>) => (
    <Row gap={8} flexWrap="wrap" data-testid={dataTestId}>
        {options.map(({ id, emoji }) => (
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
