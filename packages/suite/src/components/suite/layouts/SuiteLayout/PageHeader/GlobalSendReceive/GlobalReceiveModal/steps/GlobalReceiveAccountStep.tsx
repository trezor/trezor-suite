import { Translation } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { CardList, Column, Text } from '@trezor/components';

import { AssetsModal } from 'src/components/suite/asset-picker/components';

import { GlobalReceiveAccountListItem } from '../components/GlobalReceiveAccountListItem';
import { GlobalReceiveAssetDescription } from '../components/GlobalReceiveAssetDescription';

type GlobalReceiveAccountStepProps = {
    accounts: Account[];
    asset: TradingAssetOption | undefined;
    onAccountClick: (account: Account) => void;
    onBack: () => void;
    onCancel: () => void;
};

export const GlobalReceiveAccountStep = ({
    accounts,
    asset,
    onAccountClick,
    onBack,
    onCancel,
}: GlobalReceiveAccountStepProps) => (
    <AssetsModal
        heading={<Translation id="TR_RECEIVE" />}
        description={<GlobalReceiveAssetDescription asset={asset} />}
        onBackClick={onBack}
        onClose={onCancel}
        maxHeight={670}
        padding={16}
        data-testid="@global-receive/modal"
    >
        <Column gap={4}>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_GLOBAL_RECEIVE_SELECT_ACCOUNT" />
            </Text>
            <CardList>
                {accounts.map(account => (
                    <GlobalReceiveAccountListItem
                        key={account.key}
                        account={account}
                        dataTestId={`@global-receive-account/${account.accountType}/${account.symbol}/${account.index}`}
                        iconSize={24}
                        onClick={onAccountClick}
                    />
                ))}
            </CardList>
        </Column>
    </AssetsModal>
);
