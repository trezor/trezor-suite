import { Translation } from '@suite/intl';
import { Link } from '@trezor/components';
import { HELP_CENTER_REPLACE_BY_FEE_ETHEREUM } from '@trezor/urls';

type EvmBumpFeeTooltipProps = {
    isDisabled?: boolean;
    nonce?: number;
};

export const EvmBumpFeeTooltip = ({ isDisabled, nonce }: EvmBumpFeeTooltipProps) => {
    if (!nonce) return null;

    if (isDisabled)
        return (
            <Translation
                id="TR_BUMP_FEE_DISABLED_TOOLTIP"
                values={{
                    nonce,
                    a: chunks => <Link href={HELP_CENTER_REPLACE_BY_FEE_ETHEREUM}>{chunks}</Link>,
                }}
            />
        );

    return <Translation id="TR_TRANSACTION_NONCE_TOOLTIP" values={{ nonce }} />;
};
