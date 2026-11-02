import { Translation } from '@suite/intl';
import { BlurUrls } from '@trezor/components';

type NftUrlBlurProps = {
    text: string;
};

export const NftUrlBlur = ({ text }: NftUrlBlurProps) => (
    <BlurUrls text={text} tooltipContent={<Translation id="TR_URL_IN_TOKEN" />} />
);
