import { Image, Row } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { type AllowanceProvider } from './AllowanceProviderInfo';

type AllowanceProviderLogoProps = {
    logo: NonNullable<AllowanceProvider['logo']>;
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
