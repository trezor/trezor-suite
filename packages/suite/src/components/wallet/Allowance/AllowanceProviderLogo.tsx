import { Image, Row } from '@trezor/components';
import { TokenIcon, type TokenIconProps } from '@trezor/product-components';

export type AllowanceProviderLogoSource = string | TokenIconProps;

type AllowanceProviderLogoProps = {
    logo: AllowanceProviderLogoSource;
};

export const AllowanceProviderLogo = ({ logo }: AllowanceProviderLogoProps) => (
    <Row alignItems="center" justifyContent="center">
        {typeof logo === 'string' ? (
            <Image imageSrc={logo} maxHeight={20} borderRadius={4} />
        ) : (
            <TokenIcon {...logo} />
        )}
    </Row>
);
