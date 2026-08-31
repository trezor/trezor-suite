import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Column, H4, IconCircle, Paragraph, Row, Text } from '@trezor/components';
import { PlusIcon } from '@trezor/icons';

import { ItemClickableContainer } from 'src/components/suite/asset-picker/components/AssetRow/ItemClickableContainer';
import { useDiscovery } from 'src/hooks/suite';

import { GlobalReceiveAccountListItem } from '../components/GlobalReceiveAccountListItem';
import { GLOBAL_RECEIVE_LIST_HEIGHT } from '../constants';
import { useAccountsOptions } from '../hooks/useAccountsOptions';
import { useFilterAccounts } from '../hooks/useFilterAccounts';

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
    onAccountClick: (account: Account) => void;
    onAddAccountClick: () => void;
};

export const GlobalReceiveAccountsTab = ({
    onAccountClick,
    onAddAccountClick,
}: GlobalReceiveAccountsTabProps) => {
    const { device } = useDevice();
    const { isDiscoveryRunning } = useDiscovery();
    const accountsOptions = useAccountsOptions();
    const accountOptions = useFilterAccounts(accountsOptions);
    const isAddAccountDisabled = isDiscoveryRunning || !device?.connected || !device?.available;

    if (accountOptions.length === 0) {
        return <AccountsNoResults />;
    }

    return (
        <Column padding={{ horizontal: 8, vertical: 8 }}>
            {accountOptions.map(({ account }) => (
                <GlobalReceiveAccountListItem
                    key={account.key}
                    account={account}
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
