import { Translation } from '@suite/intl';
import { Button } from '@trezor/components';
import { CopyIcon } from '@trezor/icons';

type CopyFieldButtonProps = {
    onClick: () => void;
    'data-testid': string;
};

export const CopyFieldButton = ({ onClick, 'data-testid': dataTestId }: CopyFieldButtonProps) => (
    <Button
        type="button"
        intent="brand"
        priority="secondary"
        size="small"
        iconLeft={CopyIcon}
        // Every button inside the form has to cancel the click, otherwise it submits the form.
        onClick={event => {
            event.preventDefault();
            onClick();
        }}
        data-testid={dataTestId}
    >
        <Translation id="TR_COPY_TO_CLIPBOARD" />
    </Button>
);
