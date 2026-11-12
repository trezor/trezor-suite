import { useState } from 'react';

import { signThunk } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { CardanoPublicKeyField } from './CardanoPublicKeyField';
import { CardanoPublicKeyFormatSwitch } from './CardanoPublicKeyFormatSwitch';
import { useCardanoSignAddresses } from './useCardanoSignAddresses';
import { SignMessageForm } from '../SignMessageForm';

type CardanoSignVerifyProps = {
    account: Account;
};

/** Cardano only signs, and returns the public key next to the signature. */
export const CardanoSignVerify = ({ account }: CardanoSignVerifyProps) => {
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
                dispatch(signThunk(account, path, message, hex, false, isCose))
            }
            onClear={() => setIsCose(false)}
        />
    );
};
