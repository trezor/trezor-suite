import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Icon, Row } from '@trezor/components';
import { borders, spacings, spacingsPx } from '@trezor/theme';

import { CheckableTag } from './CheckableTag';

const TokenTabsWrapper = styled.div`
    margin: 0 -${spacingsPx.md};
    padding: ${spacings.zero} ${spacingsPx.md} ${spacingsPx.lg};
    border-bottom: ${borders.widths.small} solid ${({ theme }) => theme.elementBorderNeutralSofter};
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

export const TokenTabs = ({ tabs, activeTokenTab, setActiveTokenTab }: TokenTabsProps) => (
    <TokenTabsWrapper>
        <Row gap={spacings.xs} flexWrap="wrap">
            {tabs.map(({ tab, label }) => (
                <CheckableTag
                    key={tab}
                    $variant={activeTokenTab === tab ? 'primary' : 'tertiary'}
                    onClick={() => setActiveTokenTab(tab)}
                >
                    <Row gap={spacings.xxs}>
                        <Icon
                            name={tab === 'tokens' ? 'coins' : 'eyeSlash'}
                            {...(activeTokenTab === tab ? { intent: 'brand' } : {})}
                            size={16}
                        />
                        {label}
                    </Row>
                </CheckableTag>
            ))}
        </Row>
    </TokenTabsWrapper>
);
