import { Translation } from '@suite/intl';
import { BlurUrls, type BlurUrlsProps } from '@trezor/components';
import { type OptionalKey } from '@trezor/type-utils';

export const TokenUrlBlur = ({
    text,
    tooltipContent = <Translation id="TR_URL_IN_TOKEN" />,
}: OptionalKey<BlurUrlsProps, 'tooltipContent'>) => (
    <BlurUrls text={text} tooltipContent={tooltipContent} />
);
