import { ReactNode } from 'react';

import styled from 'styled-components';

import { Icon, Row, useElevation } from '@trezor/components';
import { borders, Elevation, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';

import { CheckableTag } from './CheckableTag';

const TokenTabsWrapper = styled.div<{ $elevation: Elevation }>`
    margin: 0 -${spacingsPx.md};
    padding: ${spacings.zero} ${spacingsPx.md} ${spacingsPx.lg};
    border-bottom: ${borders.widths.small} solid
        ${({ theme, $elevation }) => mapElevationToBorder({ $elevation, theme })};
`;

export type TokenTab = {
    tab: 'tokens' | 'hidden';
    label: ReactNode;
};

interface TokenTabsProps {
    tabs: TokenTab[];
    activeTokenTab: TokenTab['tab'];
    setActiveTokenTab: (value: TokenTab['tab']) => void;
}

export const TokenTabs = ({ tabs, activeTokenTab, setActiveTokenTab }: TokenTabsProps) => {
    const { elevation } = useElevation();

    return (
        <TokenTabsWrapper $elevation={elevation}>
            <Row gap={spacings.xs} flexWrap="wrap">
                {tabs.map(({ tab, label }) => (
                    <CheckableTag
                        key={tab}
                        $elevation={elevation}
                        $variant={activeTokenTab === tab ? 'primary' : 'tertiary'}
                        onClick={() => setActiveTokenTab(tab)}
                    >
                        <Row gap={spacings.xxs}>
                            <Icon
                                name={tab === 'tokens' ? 'tokens' : 'hide'}
                                variant={activeTokenTab === tab ? 'primary' : undefined}
                                size="medium"
                            />
                            {label}
                        </Row>
                    </CheckableTag>
                ))}
            </Row>
        </TokenTabsWrapper>
    );
};
