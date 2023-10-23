import { Link, LinkProps } from '@trezor/components';
import { useExternalLink } from 'src/hooks/suite';

export const TrezorLink = (props: LinkProps) => {
    const url = useExternalLink(props.href);

    return <Link {...props} href={url} />;
};
