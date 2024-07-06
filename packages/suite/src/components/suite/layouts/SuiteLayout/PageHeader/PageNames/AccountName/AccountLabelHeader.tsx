import { Account } from '@suite-common/wallet-types';
import { MetadataLabeling, AccountLabel } from 'src/components/suite';
import { useAccountLabel } from 'src/components/suite/AccountLabel';
import { useSelector } from 'src/hooks/suite';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { HeaderHeading } from '../BasicName';

interface AccountLabelProps {
    selectedAccount: Account;
}

const MAX_LABEL_LENGTH = 10;

const truncateLabel = (label: string | undefined, maxLength: number): string => {
    if (!label) return '';
    if (label.length <= maxLength) return label;
    return `${label.substring(0, maxLength - 3)}...`;
};

export const AccountLabelHeader = ({ selectedAccount }: AccountLabelProps) => {
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);

    const { defaultAccountLabelString } = useAccountLabel();
    const { symbol, key, path, index, accountType } = selectedAccount;

    const accountLabel = selectedAccountLabels.accountLabel || ''; // Default to an empty string if undefined
    const truncatedAccountLabel = truncateLabel(accountLabel, MAX_LABEL_LENGTH);

    return (
        <HeaderHeading>
            <MetadataLabeling
                defaultVisibleValue={
                    <AccountLabel
                        accountLabel={truncatedAccountLabel}
                        accountType={accountType}
                        symbol={selectedAccount.symbol}
                        index={index}
                    />
                }
                payload={{
                    type: 'accountLabel',
                    entityKey: key,
                    defaultValue: path,
                    value: truncatedAccountLabel,
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