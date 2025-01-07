import { Paragraph, Column } from '@trezor/components';
import {
    Bip43PathTemplate,
    AccountType,
    NetworkType,
    getNetwork,
} from '@suite-common/wallet-config';
import { getAccountTypeDesc, getAccountTypeUrl } from '@suite-common/wallet-utils';
import { spacings } from '@trezor/theme';
import { Account } from '@suite-common/wallet-types';

import { Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

interface AccountTypeDescriptionProps {
    bip43Path: Bip43PathTemplate;
    accountType?: AccountType;
    symbol?: Account['symbol'];
    networkType?: NetworkType;
}

export const AccountTypeDescription = ({
    bip43Path,
    accountType,
    symbol,
    networkType,
}: AccountTypeDescriptionProps) => {
    const accountTypeUrl = getAccountTypeUrl(bip43Path);
    const accountTypeDescId = getAccountTypeDesc({ path: bip43Path, accountType, networkType });

    const renderAccountTypeDesc = () => {
        if (symbol && accountType === 'normal' && networkType === 'ethereum') {
            return (
                <Translation id={accountTypeDescId} values={{ value: getNetwork(symbol).name }} />
            );
        }

        return <Translation id={accountTypeDescId} />;
    };

    return (
        <Column alignItems="flex-start" gap={spacings.sm}>
            <Paragraph>{renderAccountTypeDesc()}</Paragraph>
            {accountTypeUrl && <LearnMoreButton url={accountTypeUrl} />}
        </Column>
    );
};
