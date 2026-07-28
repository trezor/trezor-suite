import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Account NFTs', { tag: ['@group=manual'] }, () => {
    test(
        'NFTs tab and hidden NFTs',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that NFTs are listed in the NFTs tab and can be hidden/unhidden.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with NFTs support enabled in Settings and Rabby wallet with paired Trezor device',
                    'EVM account holding NFTs (both ERC721 and ERC1155, including some spam NFTs)',
                ],
                steps: [
                    'Navigate to the EVM account and open the "NFTs" tab',
                    'Confirm owned NFT collections and items are listed with names and previews',
                    'Confirm both ERC721 and ERC1155 NFTs are listed',
                    'Open an NFT detail and confirm its metadata and explorer link are correct',
                    'Hide an NFT (or collection) via its context menu',
                    'Confirm it moves to the "Hidden" section',
                    'Unhide it and confirm it returns to the main list',
                    'In Rabby wallet, send an ERC721 NFT to another address and confirm the transaction on the device',
                    'In Rabby wallet, send an ERC1155 NFT to another address and confirm the transaction on the device',
                    'Confirm both NFT transfers appear in the transaction history',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Low,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
