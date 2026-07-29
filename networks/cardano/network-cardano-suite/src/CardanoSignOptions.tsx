import { Translation } from '@suite/intl';
import type { SignOptionComponentProps } from '@suite/sign-verify/network';
import { SelectBar } from '@trezor/components';

export const CardanoSignOptions = ({ field }: SignOptionComponentProps) => (
    <SelectBar
        label={<Translation id="TR_PUBLIC_KEY_FORMAT" />}
        options={[
            {
                value: false,
                label: <Translation id="TR_PUBLIC_KEY_RAW" />,
            },
            {
                value: true,
                label: <Translation id="TR_PUBLIC_KEY_COSE" />,
            },
        ]}
        data-testid="@sign-verify/cardano-pubkey-format"
        {...field}
    />
);
