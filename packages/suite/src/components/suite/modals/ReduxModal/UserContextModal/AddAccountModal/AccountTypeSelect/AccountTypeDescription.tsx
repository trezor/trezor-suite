import styled from 'styled-components';
import { Button, Paragraph } from '@trezor/components';
import { Network } from 'src/types/wallet';
import { Translation, TrezorLink } from 'src/components/suite';
import { getAccountTypeDesc, getAccountTypeUrl } from '@suite-common/wallet-utils';
import { spacingsPx } from '@trezor/theme';

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
            {accountTypeUrl && (
                <TrezorLink variant="nostyle" href={accountTypeUrl}>
                    <Button
                        variant="tertiary"
                        size="small"
                        icon="EXTERNAL_LINK"
                        iconAlignment="right"
                    >
                        <Translation id="TR_LEARN_MORE" />
                    </Button>
                </TrezorLink>
            )}
        </>
    );
};
