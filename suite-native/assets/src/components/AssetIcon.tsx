import { type ComponentProps } from 'react';

import { TokenIcon } from '@suite-native/tokens';

type AssetIconProps = ComponentProps<typeof TokenIcon>;

/** The icon of a native token or a token, with a token's placeholder resolved from its metadata. */
export const AssetIcon = (props: AssetIconProps) => <TokenIcon {...props} />;
