import type { NonceOverride } from '@trezor/network-module-suite-common-types';

import { useSendFormContext } from '#src/hooks/wallet';

import { NoncePanel as DefaultNoncePanel } from './NoncePanel';
import { sendOptionFields } from './sendFormFields';
import type { SendOptionPanels } from './sendOptionPanels';
import { sendOptionsOverrides } from './sendOptionsOverrides';
import { useSendOption } from './useSendOption';

// The registry is keyed by family id; a resolved network names its family as a plain string.
const overridesByFamily: Readonly<Partial<Record<string, Partial<SendOptionPanels>>>> =
    sendOptionsOverrides;

type NonceOptionProps = {
    nonce: NonceOverride;
    family: string | undefined;
};

/** A nonce set by hand, in the family's own panel when it registered one. */
export const NonceOption = ({ nonce, family }: NonceOptionProps) => {
    const { setValue } = useSendFormContext();
    const { isEnabled, toggle } = useSendOption(sendOptionFields.nonce.option);
    const { NoncePanel = DefaultNoncePanel } =
        (family === undefined ? undefined : overridesByFamily[family]) ?? {};

    const cancel = () => {
        setValue(sendOptionFields.nonce.value, '');
        toggle();
    };

    return isEnabled ? <NoncePanel nonce={nonce} onCancel={cancel} /> : null;
};
