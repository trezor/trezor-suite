import styled from 'styled-components';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import { Row, useElevation } from '@trezor/components';
import { type Elevation, mapElevationToBorder, spacings } from '@trezor/theme';

const Item = styled.button<{ $selected?: boolean; $elevation: Elevation }>`
    width: 48px;
    height: 47px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 30px;
    padding: 1px 4px;
    border: 1px solid
        ${({ $selected, theme, $elevation }) =>
            $selected
                ? theme.backgroundPrimaryDefault
                : mapElevationToBorder({
                      theme,
                      $elevation,
                  })};

    background: ${({ $selected, theme }) =>
        $selected ? theme.backgroundPrimaryDefault : theme.backgroundNeutralBoldInverted};

    &:hover {
        background: ${({ $selected, theme }) =>
            $selected ? theme.backgroundPrimaryDefault : theme.backgroundNeutralBoldInverted};
    }
`;

export interface EmojiRatingSelectorProps {
    value: Rating | undefined;
    onChange: (rating: Rating) => void;
    'data-testid'?: string;
}

export const EmojiRatingSelector = ({
    value,
    onChange,
    'data-testid': dataTestId,
}: EmojiRatingSelectorProps) => {
    const { elevation } = useElevation();

    return (
        <Row gap={spacings.xs} data-testid={dataTestId}>
            {ratingOptions.map(({ id, emoji }) => (
                <Item
                    key={id}
                    $selected={value === id}
                    data-testid={`${dataTestId}/${id}`}
                    onClick={() => onChange(id)}
                    type="button"
                    $elevation={elevation}
                >
                    {emoji}
                </Item>
            ))}
        </Row>
    );
};
