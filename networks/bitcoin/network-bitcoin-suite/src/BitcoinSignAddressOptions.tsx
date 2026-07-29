import { Translation } from '@suite/intl';
import type { SignOptionComponentProps } from '@suite/sign-verify/network';
import { SelectBar, Tooltip } from '@trezor/components';

export const BitcoinSignAddressOptions = ({
    account,
    network,
    field,
}: SignOptionComponentProps) => {
    // Empty accountTypes means there is only 'normal' accountType and therefore the signatures are same.
    const signFormatsDiffer =
        account.accountType !== 'legacy' && Object.keys(network?.accountTypes ?? {}).length >= 1;

    return signFormatsDiffer ? (
        <SelectBar
            label={
                <Tooltip
                    maxWidth={330}
                    content={
                        <Translation
                            id="TR_FORMAT_TOOLTIP"
                            values={{
                                FormatDescription: chunks => <p>{chunks}</p>,
                                span: chunks => <strong>{chunks}</strong>,
                            }}
                        />
                    }
                    hasIcon
                >
                    <Translation id="TR_FORMAT" />
                </Tooltip>
            }
            options={[
                {
                    value: false,
                    label: <Translation id="TR_BIP_SIG_FORMAT" />,
                },
                {
                    value: true,
                    label: <Translation id="TR_COMPATIBILITY_SIG_FORMAT" />,
                },
            ]}
            data-testid="@sign-verify/format"
            {...field}
        />
    ) : null;
};
