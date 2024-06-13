import { IconName } from '@suite-common/icons';
import { TranslationKey } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { Button } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { typography, borders, spacingsPx } from '@trezor/theme';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { NavigationItem } from 'src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import styled, { css } from 'styled-components';

const NavListItemWrapper = styled(NavigationItem)`
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    white-space: nowrap;
    gap: ${spacingsPx.xs};
    ${typography.body}

    ${({ isActive }) =>
        isActive
            ? css`
                  border-radius: ${borders.radii.full};
              `
            : ''}

    svg {
        width: 16px;
    }

    div:first-child {
        ${SCREEN_QUERY.BELOW_DESKTOP} {
            display: none;
        }
    }

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        margin: ${spacingsPx.xs} 0;
    }

    ${SCREEN_QUERY.MOBILE} {
        padding: ${spacingsPx.xxs} ${spacingsPx.xs};
        gap: ${spacingsPx.xxs};
        margin: ${spacingsPx.xxs} 0;
    }
`;

const ButtonWrapper = styled(Button)`
    margin-left: auto;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        margin-left: 0;
    }
`;

interface CoinmarketLayoutNavigationItemProps {
    route: Route['name'];
    title: TranslationKey;
    icon?: IconName;
}

const CoinmarketLayoutNavigationItem = ({
    route,
    title,
    icon,
}: CoinmarketLayoutNavigationItemProps) => {
    const account = useSelector(selectSelectedAccount);
    const routeName = useSelector(state => state.router.route?.name);
    const dispatch = useDispatch();
    const transactionsRoute = 'wallet-coinmarket-transactions';

    const handleTransactionRoute = () =>
        dispatch(goto(transactionsRoute, { preserveParams: true }));

    if (route === transactionsRoute) {
        return (
            <ButtonWrapper
                size="small"
                data-test={transactionsRoute}
                variant="tertiary"
                title={title}
                onClick={handleTransactionRoute}
            >
                <Translation id={title} />
            </ButtonWrapper>
        );
    }

    if (route === 'wallet-coinmarket-savings-setup' && account) {
        return (
            <NavListItemWrapper
                key="wallet-coinmarket-savings"
                isActive={!!routeName?.startsWith('wallet-coinmarket-savings')}
                goToRoute="wallet-coinmarket-savings-setup"
                icon="clock"
                nameId="TR_NAV_SAVINGS"
                dataTest="@coinmarket/menu/wallet-coinmarket-savings-setup"
                values={{
                    cryptoCurrencyName: <Translation id={getTitleForNetwork(account.symbol)} />,
                }}
                preserveParams
            />
        );
    }

    return (
        <NavListItemWrapper
            data-test={`@coinmarket/menu/${route}`}
            nameId={title}
            isActive={routeName === route}
            icon={icon ?? 'receive'}
            goToRoute={route}
            preserveParams
        />
    );
};

export default CoinmarketLayoutNavigationItem;
