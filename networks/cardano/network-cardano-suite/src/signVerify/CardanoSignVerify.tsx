import { useState } from 'react';

import { SignMessageForm } from '@suite/sign-verify';
import { signCardanoMessageThunk } from '@suite-common/sign-verify';
import { useServices } from '@trezor/dependency-injection';
import { type SignVerifyProps } from '@trezor/network-module-suite-types';
import { injectDispatch } from '@trezor/redux-utils';

import { CardanoPublicKeyField } from './CardanoPublicKeyField';
import { CardanoPublicKeyFormatSwitch } from './CardanoPublicKeyFormatSwitch';
import { useCardanoSignAddresses } from './useCardanoSignAddresses';

/** Cardano only signs, and returns the public key next to the signature. */
export const CardanoSignVerify = ({ account }: SignVerifyProps) => {
    const [isCose, setIsCose] = useState(false);

    const { dispatch } = useServices(injectDispatch);
    const addresses = useCardanoSignAddresses(account);

    return (
        <SignMessageForm
            // A form of its own for each account throws away everything the previous one was in
            // the middle of, including the outcome it had reached.
            key={account.key}
            symbol={account.symbol}
            addresses={addresses}
            isAddressSelectable
            canVerify={false}
            signingOptions={<CardanoPublicKeyFormatSwitch isCose={isCose} onChange={setIsCose} />}
            signedMessageFields={<CardanoPublicKeyField />}
            signMessage={({ path, message, hex }) =>
                dispatch(signCardanoMessageThunk({ account, path, message, hex, isCose }))
            }
            onClear={() => setIsCose(false)}
        />
    );
};
