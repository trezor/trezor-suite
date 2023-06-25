import React from 'react';

import { Translation } from 'src/components/suite';
import { ConfirmValueOnDevice, ConfirmDeviceScreenProps } from './ConfirmValueOnDevice';
import { Account, NetworkSymbol } from 'src/types/wallet/index';

interface ConfirmXpubProps
    extends Pick<ConfirmDeviceScreenProps, 'verify' | 'isConfirmed' | 'onCancel' | 'value'> {
    accountIndex: number;
    symbol: NetworkSymbol;
    accountLabel: Account['metadata']['accountLabel'];
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
        copyButtonText={<Translation id="TR_XPUB_MODAL_CLIPBOARD" />}
        valueDataTest="@xpub-modal/xpub-field"
        {...props}
    />
);
