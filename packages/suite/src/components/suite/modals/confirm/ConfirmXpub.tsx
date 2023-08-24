import React from 'react';

import { Translation } from 'src/components/suite';
import { ConfirmValueOnDevice, ConfirmDeviceScreenProps } from './ConfirmValueOnDevice';
import { NetworkSymbol } from 'src/types/wallet/index';
import { AccountLabels } from 'src/types/suite/metadata';
import { showXpub } from 'src/actions/wallet/publicKeyActions';

interface ConfirmXpubProps
    extends Pick<ConfirmDeviceScreenProps, 'isConfirmed' | 'onCancel' | 'value'> {
    accountIndex: number;
    symbol: NetworkSymbol;
    accountLabel: AccountLabels['accountLabel'];
}

export const ConfirmXpub = ({ accountIndex, symbol, accountLabel, ...props }: ConfirmXpubProps) => (
    <ConfirmValueOnDevice
        heading={
            accountLabel ? (
                <Translation id="TR_XPUB_MODAL_TITLE_METADATA" values={{ accountLabel }} />
            ) : (
                <Translation
                    id="TR_XPUB_MODAL_TITLE"
                    values={{
                        networkName: symbol.toUpperCase(),
                        accountIndex: `#${accountIndex + 1}`,
                    }}
                />
            )
        }
        validateOnDevice={showXpub}
        copyButtonText={<Translation id="TR_XPUB_MODAL_CLIPBOARD" />}
        valueDataTest="@xpub-modal/xpub-field"
        {...props}
    />
);
