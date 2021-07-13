import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import { Network } from '@wallet-types';
import { Translation, ExternalLink } from '@suite-components';
import { WIKI_BECH32_URL, WIKI_P2SH_URL, WIKI_P2PKH_URL } from '@suite-constants/urls';
import { getBip43Shortcut } from '@wallet-utils/accountUtils';
import { ExtendedMessageDescriptor } from '@suite-types';

const Info = styled(P)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin: 20px 0;
`;

interface Description {
    description: ExtendedMessageDescriptor['id'];
    url: string;
}

const selectDescription = (network: Network): Description => {
    const bip43 = getBip43Shortcut(network.bip44);
    switch (bip43) {
        case 'bech32':
            return {
                description: 'TR_ACCOUNT_DETAILS_TYPE_BECH32',
                url: WIKI_BECH32_URL,
            };
        case 'p2sh':
            return {
                description: 'TR_ACCOUNT_DETAILS_TYPE_P2SH',
                url: WIKI_P2SH_URL,
            };
        default:
            return {
                description: 'TR_ACCOUNT_DETAILS_TYPE_P2PKH',
                url: WIKI_P2PKH_URL,
            };
    }
};

interface Props {
    network: Network;
    accountTypes?: Network[];
}

export const AccountTypeDescription = ({ network, accountTypes }: Props) => {
    if (!accountTypes || accountTypes.length <= 1) return null;
    const { description, url } = selectDescription(network);

    return (
        <Info size="small" textAlign="left">
            <Translation id={description} />{' '}
            <ExternalLink href={url} size="small">
                <Translation id="TR_LEARN_MORE" />
            </ExternalLink>
        </Info>
    );
};
