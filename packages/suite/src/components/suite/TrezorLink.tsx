import { Link, type LinkProps } from '@trezor/components';

import { useExternalLink } from 'src/hooks/suite';

export const TrezorLink = ({ href, ...props }: LinkProps) => {
    const url = useExternalLink(href);

    return <Link {...props} href={url} />;
};
