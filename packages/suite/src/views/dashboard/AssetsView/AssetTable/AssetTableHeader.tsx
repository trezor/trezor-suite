import styled from 'styled-components';

import { spacingsPx, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { AssetTableRowGrid } from './AssetTableRowGrid';

const Header = styled.div`
    display: flex;
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    align-items: center;
    padding: ${spacingsPx.sm} 0;
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};

    &:last-child {
        padding-right: ${spacingsPx.md};
    }
`;

const HeaderRight = styled(Header)`
    justify-content: right;
    padding-right: ${spacingsPx.xxxl};
`;

export const AssetTableHeader = () => (
    <AssetTableRowGrid>
        <Header /> {/* Logo */}
        <Header>
            <Translation id="TR_ASSETS" />
        </Header>
        <Header>
            <Translation id="TR_VALUES" />
        </Header>
        <HeaderRight>
            <Translation id="TR_EXCHANGE_RATE" />
        </HeaderRight>
        <Header>
            <Translation id="TR_7D_CHANGE" />
        </Header>
        <Header /> {/* Buy Button */}
    </AssetTableRowGrid>
);
