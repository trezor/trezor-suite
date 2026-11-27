import { Translation } from '@suite/intl';
import { Input } from '@trezor/components';

import { type WatchOnlyAddressInputState } from './useWatchOnlyAddressInput';

type WatchOnlyAddressInputProps = {
    state: WatchOnlyAddressInputState;
};

export const WatchOnlyAddressInput = ({
    state: { value, setValue, error, isResolving, resolvedAddress },
}: WatchOnlyAddressInputProps) => {
    const getBottomText = () => {
        if (error) return <Translation id={error} />;
        if (isResolving) return <Translation id="TR_ENS_RESOLVING" />;
        if (resolvedAddress) {
            return <Translation id="TR_ENS_WALLET_ADDRESS" values={{ address: resolvedAddress }} />;
        }

        return null;
    };

    return (
        <Input
            data-testid="@add-account/watch-only-address"
            label={<Translation id="TR_WATCH_ONLY_ADDRESS_LABEL" />}
            value={value}
            onChange={event => setValue(event.target.value)}
            bottomText={getBottomText()}
            hasError={!!error}
        />
    );
};
