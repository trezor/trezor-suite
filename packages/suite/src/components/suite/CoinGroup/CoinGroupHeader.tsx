import styled from 'styled-components';

import { NewIconButton, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

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
                <Paragraph typographyStyle="highlight">
                    <Translation id="TR_SELECT_COIN_FOR_SETTINGS" />
                </Paragraph>
            )}
            {isAtLeastOneActive && (
                <NewIconButton
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
