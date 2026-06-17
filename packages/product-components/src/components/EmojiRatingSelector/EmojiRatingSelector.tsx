import styled from 'styled-components';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import { Row } from '@trezor/components';
import { borders } from '@trezor/theme';

const Item = styled.button<{ $selected?: boolean }>`
    width: 40px;
    height: 40px;
    border-radius: ${borders.radii.full};
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 22px;
    padding: 0;

    border: none;
    background: ${({ $selected, theme }) =>
        $selected ? theme.elementFillElevatedPressed : 'transparent'};

    &:hover {
        background: ${({ theme }) => theme.elementFillElevatedHovered};
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
    <Row gap={8} data-testid={dataTestId}>
        {ratingOptions.map(({ id, emoji }) => (
            <Item
                key={id}
                $selected={value === id}
                data-testid={`${dataTestId}/${id}`}
                onClick={() => onChange(id)}
                type="button"
            >
                {emoji}
            </Item>
        ))}
    </Row>
);
