import styled from 'styled-components';
import { Paragraph } from '@trezor/components';
import { Network } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { getAccountTypeDesc, getAccountTypeUrl } from '@suite-common/wallet-utils';
import { spacingsPx } from '@trezor/theme';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

const Info = styled(Paragraph)`
    margin: ${spacingsPx.md} 0 ${spacingsPx.xs};
`;

interface AccountTypeDescriptionProps {
    bip43Path: Network['bip43Path'];
    hasMultipleAccountTypes: boolean;
}

export const AccountTypeDescription = ({
    bip43Path,
    hasMultipleAccountTypes,
}: AccountTypeDescriptionProps) => {
    if (!hasMultipleAccountTypes) return null;
    const accountTypeUrl = getAccountTypeUrl(bip43Path);
    const accountTypeDesc = getAccountTypeDesc(bip43Path);

    return (
        <>
            <Info>
                <Translation id={accountTypeDesc} />
            </Info>
            {accountTypeUrl && <LearnMoreButton url={accountTypeUrl} />}
        </>
    );
};
