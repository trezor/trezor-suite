import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Pagination', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test(
        'Pagination on accounts',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can navigate through the pages of transactions on an account.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'On "standard" wallet, navigate to the "Accounts"',
                    'Click on first account of "legacy" type',
                    'Go to the "5th" page of transactions via the "pagination button"',
                    'Verify that you’re indeed on "page 5"',
                    'Go to the "3rd" page of transactions via the "pagination input field"',
                    'Verify, that you’re indeed on "page 3"',
                    'Go to next page via next page arrow button',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
                stream: TestStream.Engagement,
            }),
        },

        async ({ onboardingPage, walletPage, paginationControl, settingsPage }) => {
            await test.step('Complete onboarding', async () => {
                await onboardingPage.completeOnboarding();
                await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
                await walletPage.expandAllAccountsInMenu();
                await walletPage.openAccount({ symbol: 'btc', type: 'legacy', atIndex: 0 });
            });

            await test.step('Go to page with pagination button', async () => {
                await paginationControl.pageButtonSelector(5).click();
                await paginationControl.checkIfPageIsActive(5);
                await paginationControl.checkIfPageIsInactive(1);

                await expect(
                    paginationControl.transactionAddress(
                        '6fe27bc17a90fc2ef2e161d333c941e972cd96b6ff9f0831e19348f73275bd35-0',
                    ),
                ).toHaveText('1DyH zbQU ... vNiw NE');
            });

            await test.step('Go to page via input field', async () => {
                await paginationControl.goToPageViaInput('3');
                await paginationControl.checkIfPageIsActive(3);
                await paginationControl.checkIfPageIsInactive(5);

                await expect(
                    paginationControl.transactionAddress(
                        '02e5a4faa8d24d2a8abdfc0baabd03c000cb4c4db2b9441e206a6ec0985f3ac2-1',
                    ),
                ).toHaveText('128p zPox ... xckW HS');
            });

            await test.step('Go to next page button', async () => {
                await paginationControl.goToNextPage.click();

                await expect(
                    paginationControl.transactionAddress(
                        '424b2e6a4fc3b5702d1a6f9b74175db9cfb8f554f71ed7ee83ee0fa08f839da2-0',
                    ),
                ).toHaveText('1L7k 8mh7 ... KkDq vj');

                await paginationControl.checkIfPageIsActive(4);
                await paginationControl.checkIfPageIsInactive(3);
            });
        },
    );
});
