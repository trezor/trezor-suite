import { Translation, type TranslationKey } from '@suite/intl';
import { Box, Row, SelectBar, Text, Tooltip } from '@trezor/components';
import { type SignatureFormat } from '@trezor/network-module-suite-common-types';

const FORMAT_SWITCH_WIDTH = 360;

// TODO: Hack: the app labels every network's signature formats itself instead of the network
// providing the labels. Remove as https://github.com/trezor/trezor-suite/issues/32472
// progresses.
const FORMAT_LABELS: Record<SignatureFormat, TranslationKey> = {
    trezor: 'TR_BIP_SIG_FORMAT',
    electrum: 'TR_COMPATIBILITY_SIG_FORMAT',
    raw: 'TR_PUBLIC_KEY_RAW',
    cose: 'TR_PUBLIC_KEY_COSE',
};

type FormatSwitchProps = {
    options: readonly SignatureFormat[];
    selectedOption?: SignatureFormat;
    onChange: (value: SignatureFormat) => void;
    isDisabled?: boolean;
};

export const FormatSwitch = ({ options, isDisabled, ...field }: FormatSwitchProps) => {
    const label = (
        <Text case="capitalize" intent="neutral" priority="secondary" typographyStyle="body-md">
            <Translation id="TR_FORMAT" />
        </Text>
    );

    return (
        <Row gap={12}>
            {/* TODO: Hack: the tooltip explains Bitcoin's formats, so it is shown by its 'electrum'
                format. Remove as https://github.com/trezor/trezor-suite/issues/32472
                progresses. */}
            {options.includes('electrum') ? (
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
                    {label}
                </Tooltip>
            ) : (
                label
            )}
            <Box width={FORMAT_SWITCH_WIDTH}>
                <SelectBar
                    isFullWidth
                    isDisabled={isDisabled}
                    options={options.map(format => ({
                        value: format,
                        label: <Translation id={FORMAT_LABELS[format]} />,
                    }))}
                    data-testid="@sign-verify/format"
                    {...field}
                />
            </Box>
        </Row>
    );
};
