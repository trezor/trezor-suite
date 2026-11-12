import { useState } from 'react';

import { getHasSelectableSignatureFormat, signThunk } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { BitcoinSignatureFormatSwitch } from './BitcoinSignatureFormatSwitch';
import { SignMessageForm } from '../SignMessageForm';
import { type SignVerifyPage } from '../types';
import { useAccountSignAddresses } from '../useAccountSignAddresses';

type BitcoinSignMessageFormProps = {
    account: Account;
    onPageChange: (page: SignVerifyPage) => void;
};

export const BitcoinSignMessageForm = ({ account, onPageChange }: BitcoinSignMessageFormProps) => {
    const [isElectrum, setIsElectrum] = useState(false);

    const { dispatch } = useServices(injectDispatch);
    const addresses = useAccountSignAddresses(account);

    return (
        <SignMessageForm
            symbol={account.symbol}
            addresses={addresses}
            isAddressSelectable
            canVerify
            onPageChange={onPageChange}
            signingOptions={
                getHasSelectableSignatureFormat(account) && (
                    <BitcoinSignatureFormatSwitch
                        isElectrum={isElectrum}
                        onChange={setIsElectrum}
                    />
                )
            }
            signMessage={({ path, message, hex }) =>
                dispatch(signThunk(account, path, message, hex, isElectrum))
            }
            onClear={() => setIsElectrum(false)}
        />
    );
};
