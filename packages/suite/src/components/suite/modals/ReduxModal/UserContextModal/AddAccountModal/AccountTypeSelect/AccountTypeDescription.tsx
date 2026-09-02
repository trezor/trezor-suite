import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import {
    type AccountType,
    type NetworkSymbol,
    type NetworkType,
    getNetwork,
} from '@suite-common/wallet-config';
import { getAccountTypeDesc, getAccountTypeUrl } from '@suite-common/wallet-utils';
import { Column, Paragraph } from '@trezor/components';
import type { Bip43PathTemplate } from '@trezor/crypto-utils';

interface AccountTypeDescriptionProps {
    bip43Path: Bip43PathTemplate;
    accountType: AccountType;
    symbol: NetworkSymbol;
    networkType: NetworkType;
}

export const AccountTypeDescription = ({
    bip43Path,
    accountType,
    symbol,
    networkType,
}: AccountTypeDescriptionProps) => {
    const accountTypeUrl = getAccountTypeUrl(bip43Path);
    const accountTypeDescId = getAccountTypeDesc({ path: bip43Path, accountType, networkType });

    return (
        <Column alignItems="flex-start" gap={12}>
            <Paragraph>
                <Translation id={accountTypeDescId} values={{ value: getNetwork(symbol).name }} />
            </Paragraph>
            {accountTypeUrl && <LearnMoreButton url={accountTypeUrl} />}
        </Column>
    );
};
