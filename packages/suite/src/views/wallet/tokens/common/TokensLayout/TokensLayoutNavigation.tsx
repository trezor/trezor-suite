import styled, { css } from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { IconName } from '@suite-common/icons';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { Elevation, borders, spacingsPx, mapElevationToBorder, typography } from '@trezor/theme';
import { useElevation, variables } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { NavigationItem } from '../../../../../components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { getTokens } from 'src/utils/wallet/tokenUtils';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

const List = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
    margin-bottom: ${spacingsPx.md};
`;

const NavListItem = styled(NavigationItem)`
    gap: ${spacingsPx.xs};
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    ${typography.hint}

    ${({ isActive }) =>
        isActive &&
        css`
            border-radius: ${borders.radii.full};
        `}
`;

const StyledDivider = styled.div<{ $elevation: Elevation }>`
    margin: ${spacingsPx.xs} ${spacingsPx.xxs};
    border-left: 1px solid ${mapElevationToBorder};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        margin: 0 ${spacingsPx.xxs};
        flex-direction: row;
        border-bottom: 0;
        border-right: 1px solid ${mapElevationToBorder};
    }
`;

const Divider = () => {
    const { elevation } = useElevation();

    return <StyledDivider $elevation={elevation} />;
};

interface TokensLayoutNavigationProps {
    selectedAccount: SelectedAccountLoaded;
}

export const TokensLayoutNavigation = ({ selectedAccount }: TokensLayoutNavigationProps) => {
    const routeName = useSelector(state => state.router.route?.name);
    const coinDefinitions = useSelector(state =>
        selectCoinDefinitions(state, selectedAccount.account.symbol),
    );
    const isDebug = useSelector(selectIsDebugModeActive);

    const shownTokens = getTokens(
        selectedAccount.account.tokens || [],
        selectedAccount.account.symbol,
        'shown',
        isDebug,
        coinDefinitions,
    );
    const unverifiedTokens = getTokens(
        selectedAccount.account.tokens || [],
        selectedAccount.account.symbol,
        'unverified',
        isDebug,
        coinDefinitions,
    );
    const hiddenTokens = getTokens(
        selectedAccount.account.tokens || [],
        selectedAccount.account.symbol,
        'hidden',
        isDebug,
        coinDefinitions,
    );

    const Item = ({
        route,
        title,
        icon,
        count,
    }: {
        route: Route['name'];
        title: TranslationKey;
        icon: IconName;
        count: number;
    }) => (
        <NavListItem
            nameId={title}
            isActive={routeName === route}
            icon={icon}
            goToRoute={route}
            preserveParams
            iconSize="mediumLarge"
            itemsCount={count}
        />
    );

    return (
        <List>
            <Item
                route="wallet-tokens-coins"
                title="TR_COINS"
                icon="tokens"
                count={shownTokens.length}
            />
            <Divider />
            <Item
                route="wallet-tokens-hidden"
                title="TR_HIDDEN"
                icon="eyeClosed"
                count={unverifiedTokens.length + hiddenTokens.length}
            />
        </List>
    );
};
