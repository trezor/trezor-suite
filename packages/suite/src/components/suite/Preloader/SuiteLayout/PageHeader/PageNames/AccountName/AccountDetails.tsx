import styled from 'styled-components';
import { Account } from '@suite-common/wallet-types';
import { spacingsPx } from '@trezor/theme';
import { CoinLogo } from '@trezor/components';
import {
    MetadataLabeling,
    AccountLabel,
    FormattedCryptoAmount,
    FiatValue,
} from 'src/components/suite';
import { useAccountLabel } from 'src/components/suite/AccountLabel';
import { useSelector } from 'src/hooks/suite';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';

const DetailsContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

const AccountBalance = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.sm};
    color: ${({ theme }) => theme.textSubdued};
`;

const CryptoBalance = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
`;

interface AccountDetailsProps {
    selectedAccount: Account;
}

export const AccountDetails = ({ selectedAccount }: AccountDetailsProps) => {
    const selectedAccountLabels = useSelector(selectLabelingDataForSelectedAccount);

    const { defaultAccountLabelString } = useAccountLabel();

    const { symbol, key, path, index, accountType, formattedBalance } = selectedAccount;

    return (
        <DetailsContainer>
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
                defaultEditableValue={defaultAccountLabelString({ accountType, symbol, index })}
            />

            <AccountBalance>
                <CryptoBalance>
                    <CoinLogo size={16} symbol={symbol} />
                    <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                </CryptoBalance>

                <span>
                    ~<FiatValue amount={formattedBalance} symbol={symbol} />
                </span>
            </AccountBalance>
        </DetailsContainer>
    );
};
