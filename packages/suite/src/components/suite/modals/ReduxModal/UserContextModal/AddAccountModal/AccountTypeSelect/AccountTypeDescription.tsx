import styled from 'styled-components';
import { Paragraph } from '@trezor/components';
import { Network } from 'src/types/wallet';
import { Translation, TrezorLink } from 'src/components/suite';
import { getAccountTypeDesc, getAccountTypeUrl } from '@suite-common/wallet-utils';

const Info = styled(Paragraph).attrs(() => ({
    size: 'small',
    textAlign: 'left',
}))`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin: 20px 0;
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
        <Info>
            <Translation id={accountTypeDesc} />
            {accountTypeUrl && (
                <>
                    {' '}
                    <TrezorLink icon="EXTERNAL_LINK" href={accountTypeUrl} type="hint">
                        <Translation id="TR_LEARN_MORE" />
                    </TrezorLink>
                </>
            )}
        </Info>
    );
};
