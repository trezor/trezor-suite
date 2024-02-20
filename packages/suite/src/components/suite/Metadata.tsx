import { SUITE_URL } from '@trezor/urls';
import Helmet from 'react-helmet';
import { useIntl } from 'react-intl';
import messages from 'src/support/messages';

type MetadataProps = {
    title?: string;
    description?: string;
    url?: string;
};

export const Metadata = ({
    title = 'Trezor Suite',
    description,
    url = SUITE_URL,
}: MetadataProps) => {
    const intl = useIntl();
    description = description || intl.formatMessage(messages.TR_SUITE_META_DESCRIPTION);

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="title" key="title" content={title} />
            <meta name="description" key="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" key="og:type" content="website" />
            <meta property="og:url" key="og:url" content={url} />
            <meta property="og:title" key="og:title" content={title} />
            <meta property="og:description" key="og:description" content={description} />
            {/* <meta property="og:image" key="og:image" content={image} />*}

            {/* Twitter */}
            <meta property="twitter:card" key="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" key="twitter:url" content={url} />
            <meta property="twitter:title" key="twitter:title" content={title} />
            <meta property="twitter:description" key="twitter:description" content={description} />
            {/* <meta property="twitter:image" key="twitter:image" content={image} /> */}
        </Helmet>
    );
};
