import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import { Network } from '@wallet-types';
import { Translation, TrezorLink } from '@suite-components';
import { getAccountTypeDesc, getAccountTypeUrl } from '@suite-common/wallet-utils';

const Info = styled(P)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin: 20px 0;
`;

interface Props {
    network: Network;
    accountTypes?: Network[];
}

export const AccountTypeDescription = ({ network, accountTypes }: Props) => {
    if (!accountTypes || accountTypes.length <= 1) return null;
    const accountTypeUrl = getAccountTypeUrl(network.bip43Path);
    const accountTypeDesc = getAccountTypeDesc(network.bip43Path);

    return (
        <Info size="small" textAlign="left">
            <Translation id={accountTypeDesc} />{' '}
            <TrezorLink icon="EXTERNAL_LINK" href={accountTypeUrl} size="small">
                <Translation id="TR_LEARN_MORE" />
            </TrezorLink>
        </Info>
    );
};
