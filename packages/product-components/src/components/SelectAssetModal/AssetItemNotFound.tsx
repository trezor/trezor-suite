import { Column, Paragraph, Text } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import { SelectAssetNetworkProps, SelectAssetSearchCategoryType } from './SelectAssetModal';
import { spacings } from '@trezor/theme';

interface AssetItemNotFoundProps {
    searchCategory: SelectAssetSearchCategoryType;
    networkCategories: SelectAssetNetworkProps[];
    listHeight: string;
    listMinHeight: number;
}

export const AssetItemNotFound = ({
    searchCategory,
    networkCategories,
    listHeight,
    listMinHeight,
}: AssetItemNotFoundProps) => {
    // TODO: resolve messages sharing https://github.com/trezor/trezor-suite/issues/5325
    const translations = searchCategory
        ? {
              heading: {
                  id: 'TR_TOKEN_NOT_FOUND_ON_NETWORK',
                  defaultMessage: 'Token not found on the {networkName} network',
                  values: {
                      networkName: networkCategories.find(
                          category => category.coingeckoId === searchCategory.coingeckoId,
                      )?.name,
                  },
              },
              paragraph: {
                  id: 'TR_TOKEN_TRY_DIFFERENT_SEARCH_OR_SWITCH',
                  defaultMessage: 'Please try a different search or switch to another network.',
              },
          }
        : {
              heading: {
                  id: 'TR_TOKEN_NOT_FOUND',
                  defaultMessage: 'Token not found',
              },
              paragraph: {
                  id: 'TR_TOKEN_TRY_DIFFERENT_SEARCH',
                  defaultMessage: 'Please try a different search.',
              },
          };

    return (
        <Column
            alignItems="center"
            justifyContent="center"
            height={listHeight}
            minHeight={listMinHeight}
        >
            <Text typographyStyle="body">
                <FormattedMessage {...translations.heading} />
            </Text>
            <Paragraph
                align="center"
                maxWidth={280}
                margin={{
                    top: spacings.xxxs,
                    left: 'auto',
                    right: 'auto',
                }}
            >
                <Text variant="tertiary" typographyStyle="hint">
                    <FormattedMessage {...translations.paragraph} />
                </Text>
            </Paragraph>
        </Column>
    );
};
