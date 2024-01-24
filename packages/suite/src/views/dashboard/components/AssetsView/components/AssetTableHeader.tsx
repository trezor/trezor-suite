import styled from 'styled-components';
import { Translation } from '../../../../../components/suite';
import { AssetTableRowGrid } from './AssetTableRowGrid';
import { spacingsPx, typography } from '@trezor/theme';

const Header = styled.div`
    display: flex;
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    align-items: center;
    padding: ${spacingsPx.sm} 0;
    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};

    :last-child {
        padding-right: ${spacingsPx.md};
    }
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
        <Header>
            <Translation id="TR_EXCHANGE_RATE" />
        </Header>
        <Header>
            <Translation id="TR_7D_CHANGE" />
        </Header>
        <Header /> {/* Buy Button */}
    </AssetTableRowGrid>
);
