import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { type ContactsRootState, selectContactsMessaging } from '@suite-common/contacts';
import { getNetwork } from '@suite-common/wallet-config';
import { Button, Column, Row, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';

import { useRequestContactAddress } from './useRequestContactAddress';
import { selectContactsNetworks } from '../../../../../contactsSelectors';
import { ContactsErrorMessage } from '../../../ContactsErrorMessage';

export type RequestAddressButtonsProps = {
    staticSessionId: StaticSessionId;
    npub: string;
    name: string;
};

/** Asks the contact for an address over the relays, one button per network the wallet has. */
export const RequestAddressButtons = ({
    staticSessionId,
    npub,
    name,
}: RequestAddressButtonsProps) => {
    const messaging = useSelector((state: ContactsRootState) =>
        selectContactsMessaging(state, staticSessionId),
    );
    const networks = useSelector(selectContactsNetworks);
    const { pendingSlip44, outcome, request } = useRequestContactAddress(npub);

    const hasManyNetworks = networks.length > 1;

    return (
        <Column gap={4} alignItems="flex-end">
            <Row gap={8} flexWrap="wrap">
                {networks.map(({ slip44, networkSymbol }) => (
                    <Button
                        key={slip44}
                        size="small"
                        priority="secondary"
                        isLoading={pendingSlip44 === slip44}
                        isDisabled={messaging === undefined || pendingSlip44 !== undefined}
                        onClick={() => request(slip44)}
                        data-testid={`@contacts/contact/${name}/request-address`}
                    >
                        {hasManyNetworks ? (
                            <Translation
                                id="TR_CONTACTS_REQUEST_NETWORK_ADDRESS"
                                values={{ network: getNetwork(networkSymbol).name }}
                            />
                        ) : (
                            <Translation id="TR_CONTACTS_REQUEST_ADDRESS" />
                        )}
                    </Button>
                ))}
            </Row>
            {outcome?.type === 'sent' && (
                <Text typographyStyle="body-sm" intent="brand">
                    <Translation id="TR_CONTACTS_REQUEST_ADDRESS_SENT" values={{ name }} />
                </Text>
            )}
            {outcome?.type === 'error' && (
                <Text typographyStyle="body-sm" intent="critical">
                    <ContactsErrorMessage error={outcome.error} />
                </Text>
            )}
        </Column>
    );
};
