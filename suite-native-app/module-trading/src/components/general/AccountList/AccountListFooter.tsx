import { Box, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type AccountsListFooterProps = {
    onAddAccountTap: () => void;
};

export const AccountListFooter = ({ onAddAccountTap }: AccountsListFooterProps) => (
    <Box paddingTop="sp16">
        <Button
            iconLeft="plus"
            intent="neutral"
            priority="secondary"
            onPress={onAddAccountTap}
            testID="@add-account/after-discovery/button-add-new"
        >
            <Translation id="moduleAddAccounts.coinDiscoveryFinishedScreen.addButton" />
        </Button>
    </Box>
);
