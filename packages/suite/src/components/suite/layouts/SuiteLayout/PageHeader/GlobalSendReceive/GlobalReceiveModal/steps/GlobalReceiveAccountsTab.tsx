import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Column, IconCircle, Row, Text } from '@trezor/components';
import { PlusIcon } from '@trezor/icons';

import { ItemClickableContainer } from 'src/components/suite/asset-picker/components/AssetRow/ItemClickableContainer';

import { GlobalReceiveNoResults } from './GlobalReceiveNoResults';
import { GlobalReceiveAccountListItem } from '../components/GlobalReceiveAccountListItem';
import { type AccountOption } from '../hooks/useAccountsOptions';

type GlobalReceiveAccountsTabProps = {
    accountOptions: AccountOption[];
    isAddAccountDisabled: boolean;
    onAccountClick: (account: Account) => void;
    onAddAccountClick: () => void;
};

export const GlobalReceiveAccountsTab = ({
    accountOptions,
    isAddAccountDisabled,
    onAccountClick,
    onAddAccountClick,
}: GlobalReceiveAccountsTabProps) => {
    if (accountOptions.length === 0) {
        return <GlobalReceiveNoResults />;
    }

    return (
        <Column padding={{ horizontal: 8, vertical: 8 }}>
            {accountOptions.map(({ account }) => (
                <GlobalReceiveAccountListItem
                    key={account.key}
                    account={account}
                    dataTestId={`@global-receive-account/${account.accountType}/${account.symbol}/${account.index}`}
                    iconSize={40}
                    onClick={onAccountClick}
                    variant="plain"
                />
            ))}
            {!isAddAccountDisabled && (
                <ItemClickableContainer onClick={onAddAccountClick}>
                    <Row gap={12} data-testid="@global-send-receive/add-account">
                        <IconCircle icon={PlusIcon} size={40} intent="neutral" />
                        <Text typographyStyle="body-md">
                            <Translation id="TR_ADD_ACCOUNT" />
                        </Text>
                    </Row>
                </ItemClickableContainer>
            )}
        </Column>
    );
};
