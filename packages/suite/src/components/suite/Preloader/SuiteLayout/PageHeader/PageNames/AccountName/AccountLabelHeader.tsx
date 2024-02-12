import { Account } from '@suite-common/wallet-types';
import { MetadataLabeling, AccountLabel } from 'src/components/suite';
import { useAccountLabel } from 'src/components/suite/AccountLabel';
import { useSelector } from 'src/hooks/suite';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { HeaderHeading } from '../BasicName';

interface AccountLabelProps {
    selectedAccount: Account;
}

export const AccountLabelHeader = ({ selectedAccount }: AccountLabelProps) => {
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);

    const { defaultAccountLabelString } = useAccountLabel();
    const { symbol, key, path, index, accountType } = selectedAccount;

    return (
        <HeaderHeading>
            <MetadataLabeling
                defaultVisibleValue={
                    <AccountLabel
                        accountLabel={selectedAccountLabels.accountLabel}
                        accountType={accountType}
                        symbol={selectedAccount.symbol}
                        index={index}
                    />
                }
                payload={{
                    type: 'accountLabel',
                    entityKey: key,
                    defaultValue: path,
                    value: selectedAccountLabels.accountLabel,
                }}
                defaultEditableValue={defaultAccountLabelString({
                    accountType,
                    symbol,
                    index,
                })}
            />
        </HeaderHeading>
    );
};
