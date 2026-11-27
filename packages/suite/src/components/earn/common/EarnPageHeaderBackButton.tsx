import { Translation } from '@suite/intl';
import { IconButton } from '@trezor/components';
import { CaretLeftIcon } from '@trezor/icons';

type EarnPageHeaderBackButtonProps = {
    onClick?: () => void;
};

export const EarnPageHeaderBackButton = ({ onClick }: EarnPageHeaderBackButtonProps) => (
    <IconButton
        icon={CaretLeftIcon}
        intent="neutral"
        priority="secondary"
        size="large"
        onClick={onClick}
        isDisabled={!onClick}
        data-testid="@account-subpage/back"
        tooltip={{ content: <Translation id="TR_BACK" /> }}
    />
);
