import styled from 'styled-components';

import { type Rating, ratingOptions } from '@suite-common/feedback';
import { Row, useElevation } from '@trezor/components';
import { type Elevation, borders, mapElevationToBorder } from '@trezor/theme';

const Item = styled.button<{ $selected?: boolean; $elevation: Elevation }>`
    width: 40px;
    height: 40px;
    border-radius: ${borders.radii.full};
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 22px;
    padding: 0;
    border: ${borders.widths.small} solid
        ${({ $selected, theme, $elevation }) =>
            $selected
                ? theme.legacyBackgroundPrimaryDefault
                : mapElevationToBorder({
                      theme,
                      $elevation,
                  })};

    background: ${({ $selected, theme }) =>
        $selected
            ? theme.legacyBackgroundPrimaryDefault
            : theme.legacyBackgroundNeutralSubtleOnElevation0};
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
}: EmojiRatingSelectorProps) => {
    const { elevation } = useElevation();

    return (
        <Row gap={8} data-testid={dataTestId}>
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
