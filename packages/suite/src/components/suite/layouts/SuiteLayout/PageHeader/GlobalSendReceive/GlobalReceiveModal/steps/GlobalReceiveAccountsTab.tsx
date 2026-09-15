import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Column, H4, IconCircle, Paragraph, Row, Text } from '@trezor/components';
import { PlusIcon } from '@trezor/icons';

import { ItemClickableContainer } from 'src/components/suite/asset-picker/components/AssetRow/ItemClickableContainer';

import { GlobalReceiveAccountListItem } from '../components/GlobalReceiveAccountListItem';
import { GLOBAL_RECEIVE_LIST_HEIGHT } from '../constants';
import { type AccountOption } from '../hooks/useAccountsOptions';

const AccountsNoResults = () => (
    <Column
        height={GLOBAL_RECEIVE_LIST_HEIGHT}
        width="100%"
        maxWidth={380}
        alignSelf="center"
        alignItems="center"
        justifyContent="center"
        // Adjust for optical center.
        padding={{ bottom: 16 }}
    >
        <H4 typographyStyle="body-md" align="center">
            <Translation id="TR_GLOBAL_RECEIVE_NO_RESULTS" />
        </H4>
        <Paragraph typographyStyle="body-sm" priority="secondary" intent="neutral" align="center">
            <Translation id="TR_GLOBAL_RECEIVE_NO_RESULTS_DESCRIPTION" />
        </Paragraph>
    </Column>
);

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
        return <AccountsNoResults />;
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
