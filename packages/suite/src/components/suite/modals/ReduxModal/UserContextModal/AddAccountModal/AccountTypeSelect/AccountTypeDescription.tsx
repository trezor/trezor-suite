import { Paragraph, Column } from '@trezor/components';
import { Bip43PathTemplate, AccountType, NetworkType } from '@suite-common/wallet-config';
import {
    getAccountTypeDesc,
    getAccountTypeUrl,
    getTitleForNetwork,
} from '@suite-common/wallet-utils';
import { spacings } from '@trezor/theme';
import { Account } from '@suite-common/wallet-types';

import { Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useTranslation } from 'src/hooks/suite';


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
    const { translationString } = useTranslation();
    const accountTypeUrl = getAccountTypeUrl(bip43Path);
    const accountTypeDescId = getAccountTypeDesc({ path: bip43Path, accountType, networkType });

    const renderAccountTypeDesc = () => {
        if (symbol && accountType === 'normal' && networkType === 'ethereum') {
            const value = getTitleForNetwork(symbol);

            return (
                <Translation id={accountTypeDescId} values={{ value: translationString(value) }} />
            );
        }

        return <Translation id={accountTypeDescId} />;
    };

    return (
        <Column alignItems="flex-start" gap={spacings.sm}>
            <Paragraph variant="tertiary" typographyStyle="hint">
                {renderAccountTypeDesc()}
            </Paragraph>
            {accountTypeUrl && <LearnMoreButton url={accountTypeUrl} />}
        </Column>
    );
};
