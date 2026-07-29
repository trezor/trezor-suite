import { Translation, useTranslation } from '@suite/intl';
import type { SignAdditionalResultComponentProps } from '@suite/sign-verify/network';
import { Button, Input } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { CopyIcon } from '@trezor/icons';

export const CardanoSignAdditionalResult = ({
    value,
    canCopy,
}: SignAdditionalResultComponentProps) => {
    const { translationString } = useTranslation();

    return (
        <Input
            type="text"
            readOnly
            isDisabled={!value.length}
            label={translationString('TR_PUBLIC_KEY')}
            placeholder={translationString('TR_SIGNATURE_AFTER_SIGNING_PLACEHOLDER')}
            data-testid="@sign-verify/pubKey"
            value={value}
            rightContent={
                canCopy ? (
                    <Button
                        type="button"
                        intent="neutral"
                        priority="secondary"
                        onClick={() => copyToClipboard(value)}
                        iconLeft={CopyIcon}
                        size="small"
                    >
                        <Translation id="TR_COPY_TO_CLIPBOARD" />
                    </Button>
                ) : undefined
            }
        />
    );
};
