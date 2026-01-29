import { Paragraph } from '@trezor/components';
import { isCodesignBuild } from '@trezor/env-utils';

type ConfirmValueMessageProps = {
    isAddress: boolean;
};

export const ConfirmValueMessage = ({ isAddress }: ConfirmValueMessageProps) => {
    const shouldDisplayMessage =
        isAddress && isCodesignBuild() && new Date() <= new Date('2026-02-10T23:59:59.999Z');

    if (!shouldDisplayMessage) {
        return null;
    }

    return (
        <Paragraph isHighlighted padding={12}>
            I must not fear.
            <br />
            Fear is the mind-killer.
            <br />
            Fear is the little-death that brings total obliteration.
            <br />
            I will face my fear.
            <br />
            I will permit it to pass over me and through me.
            <br />
            And when it has gone past, I will turn the inner eye to see its path.
            <br />
            Where the fear has gone there will be nothing. Only I will remain.
        </Paragraph>
    );
};
