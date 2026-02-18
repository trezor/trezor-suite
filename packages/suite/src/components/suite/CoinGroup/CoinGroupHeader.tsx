import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { IconButton, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

const Wrapper = styled.div`
    @media (hover: hover) {
        display: none;
    }
`;

interface CoinGroupHeaderProps {
    isAtLeastOneActive: boolean;
    settingsMode: boolean;
    toggleSettingsMode?: () => void;
}

export const CoinGroupHeader = ({
    isAtLeastOneActive,
    settingsMode,
    toggleSettingsMode,
}: CoinGroupHeaderProps) => (
    <Wrapper>
        <Row gap={spacings.sm}>
            {settingsMode && (
                <Paragraph typographyStyle="body-md-strong">
                    <Translation id="TR_SELECT_COIN_FOR_SETTINGS" />
                </Paragraph>
            )}
            {isAtLeastOneActive && (
                <IconButton
                    icon={settingsMode ? 'x' : 'gear'}
                    onClick={toggleSettingsMode}
                    intent="neutral"
                    priority="secondary"
                    margin={{ left: 'auto' }}
                />
            )}
        </Row>
    </Wrapper>
);
