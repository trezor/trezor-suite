import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core';
import { type Account, type FormOptions } from '@suite-common/wallet-types';
import { Button, Column, Row, Text, TextButton, Tooltip } from '@trezor/components';
import { HELP_CENTER_EVM_NONCE_URL } from '@trezor/urls';

import { useDispatch } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

import { TransactionData } from '../shared/TransactionData';
import { OnOffSwitcher } from '../OnOffSwitcher';
import { EthereumNonce } from './EthereumNonce';
import { TransactionData } from '../shared/TransactionData';

export const EthereumOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction, account, setValue, control } =
        useSendFormContext();
    const dispatch = useDispatch();

    const isEthereum = account.networkType === 'ethereum';
    const [displayNonce, setDisplayNonce] = useState<string>();
    const [confirmedNonce, setConfirmedNonce] = useState<string>();
    // Nonce editing is toggled from the send-form header dropdown (EVM-only). useWatch keeps this in
    // sync with that cross-component toggle (getValues would not re-render here when it flips).
    // No defaultValue is passed: it would mask the form's current value until the next change event.
    const enabledOptions = useWatch({ name: 'options', control });
    const isEditingNonce = (enabledOptions ?? []).includes('ethereumNonce');

    useEffect(() => {
        if (account.networkType !== 'ethereum') return;

        // Resolve the nonce from the local tx list (confirmed count + pending-tx adjustment) for an
        // advisory display and the inline EthereumNonce validation. We deliberately skip
        // fetchConfirmedNonce here to avoid a backend round-trip on every form open; the authoritative
        // live-backend check is deferred to signing time (signEthereumSendFormTransactionThunk).
        const promise = dispatch(
            ethereumGetCurrentNonceThunk({
                selectedAccount: account as Account & { networkType: 'ethereum' },
            }),
        );

        void promise
            .unwrap()
            .then(result => {
                setDisplayNonce(result.nonce);
                setConfirmedNonce(result.confirmedNonce);
            })
            .catch(() => {});

        return () => {
            promise.abort();
        };
    }, [account, dispatch]);

    const options = getDefaultValue('options', []);
    const dataEnabled = options.includes('transactionData');

    const toggle = (option: FormOptions) => {
        toggleOption(option);
        composeTransaction();
    };
    const toggleData = () => toggle('transactionData');

    const cancelNonceOverride = () => {
        setValue('ethereumNonce', '');
        toggleOption('ethereumNonce');
        composeTransaction();
    };

    const enableNonceOverride = () => {
        toggleOption('ethereumNonce');
        composeTransaction();
    };

    return (
        <Column gap={16}>
            <Row gap={8}>
                {!dataEnabled && !tokenValue && (
                    <Tooltip content={<Translation id="DATA_ADD_TOOLTIP" />} cursor="pointer">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft="database"
                            data-testid="send/open-ethereum-data"
                            onClick={toggleData}
                        >
                            <Translation id="DATA_ADD" />
                        </Button>
                    </Tooltip>
                )}
                <Tooltip content={<Translation id="BROADCAST_TOOLTIP" />} cursor="pointer">
                    <Button
                        intent="neutral"
                        priority="secondary"
                        iconLeft="broadcast"
                        data-testid="send/broadcast"
                        onClick={toggleBroadcast}
                    >
                        <Row>
                            <Translation id="BROADCAST" />
                            <OnOffSwitcher isOn={broadcastEnabled} />
                        </Row>
                    </Button>
                </Tooltip>
                {isEthereum && !isEditingNonce && (
                    <Tooltip
                        addon={
                            <TextButton
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                href={HELP_CENTER_EVM_NONCE_URL}
                            >
                                <Translation id="TR_LEARN" />
                            </TextButton>
                        }
                        content={<Translation id="EVM_NONCE_TOOLTIP" />}
                        cursor="pointer"
                    >
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft="pencil"
                            data-testid="send/edit-ethereum-nonce"
                            onClick={enableNonceOverride}
                        >
                            <Row>
                                <Text typographyStyle="body-sm" data-testid="@send/ethereum-nonce">
                                    <Translation
                                        id="EVM_NONCE"
                                        values={{ nonce: displayNonce ?? '' }}
                                    />
                                </Text>
                            </Row>
                        </Button>
                    </Tooltip>
                )}
            </Row>

            {dataEnabled && (
                <TransactionData maxBytes={formInputsMaxLength.ethData} close={toggleData} />
            )}

            {isEthereum && isEditingNonce && (
                <EthereumNonce
                    displayNonce={displayNonce}
                    confirmedNonce={confirmedNonce}
                    onCancel={cancelNonceOverride}
                />
            )}
        </Column>
    );
};
