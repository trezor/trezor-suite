import { test } from '@playwright/test';

import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { MOCK_ETH_RATE } from '../mocks/mockStakingState';
import { expect } from '../support/customMatchers';

/**
 * ETH staking form limits, fraction buttons and the fiat/crypto switch.
 *
 * Converted from `suite/e2e/tests/staking/staking-form.test.ts`, which completed onboarding,
 * enabled Ethereum against a mocked blockbook and discovered an account before it could type into
 * this input. None of that is needed to exercise the form: `amountLimits` derives from the account
 * balance and staking constants, so a preloaded balance is enough.
 */
const BALANCE = '2.5';
const WITHDRAWAL_BUFFER = '0.005';
const MIN_AMOUNT_FOR_STAKING = '0.01';
const ETH_DECIMALS = 18;
const STORY = 'stakeForm/EthereumStakeInputs';

const cryptoInput = '@staking/form/crypto-input';
const bottomText = '@staking/form/crypto-input/bottom-text';

test.describe('crypto amount limits', () => {
    test('rejects an amount below the staking minimum', async ({ mount }) => {
        const component = await mount(STORY, { balance: BALANCE });

        await component.getByTestId(cryptoInput).fill('0.00000001');

        await expect(component.getByTestId(bottomText)).toHaveTranslation(
            'TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO',
            { values: { minimum: `${MIN_AMOUNT_FOR_STAKING} ETH` } },
        );
    });

    test('rejects more decimal places than the network supports', async ({ mount }) => {
        const component = await mount(STORY, { balance: BALANCE });

        await component.getByTestId(cryptoInput).fill('0.0000000000000000001');

        await expect(component.getByTestId(bottomText)).toHaveTranslation(
            'AMOUNT_IS_NOT_IN_RANGE_DECIMALS',
            { values: { decimals: ETH_DECIMALS } },
        );
    });

    test('rejects an amount above the balance', async ({ mount }) => {
        const component = await mount(STORY, { balance: BALANCE });

        await component.getByTestId(cryptoInput).fill('4000');

        await expect(component.getByTestId(bottomText)).toHaveTranslation('AMOUNT_IS_NOT_ENOUGH');
    });

    test('reports an empty amount, then accepts a valid one', async ({ mount }) => {
        const component = await mount(STORY, { balance: BALANCE });
        const input = component.getByTestId(cryptoInput);

        await input.fill('0.1');
        await input.clear();
        await expect(component.getByTestId(bottomText)).toHaveTranslation('AMOUNT_IS_NOT_SET');

        await input.fill('0.1');
        await expect(component.getByTestId(bottomText)).toBeHidden();
    });
});

test.describe('fraction buttons', () => {
    [
        { label: '10%', divisor: 10 },
        { label: '25%', divisor: 4 },
        { label: '50%', divisor: 2 },
    ].forEach(({ label, divisor }) => {
        test(`${label} fills the matching share of the balance`, async ({ mount }) => {
            const component = await mount(STORY, { balance: BALANCE });

            await component.getByRole('button', { name: label }).click();

            const expected = new BigNumber(BALANCE).dividedBy(divisor).decimalPlaces(ETH_DECIMALS);
            await expect(component.getByTestId(cryptoInput)).toHaveValue(
                localizeNumber(expected.toString()),
            );
        });
    });

    test('Max leaves the withdrawal buffer behind and warns about it', async ({ mount }) => {
        const component = await mount(STORY, { balance: BALANCE });

        await component.getByRole('button', { name: 'Max' }).click();

        const expectedMax = new BigNumber(BALANCE).minus(WITHDRAWAL_BUFFER);
        await expect(component.getByTestId(cryptoInput)).toHaveValue(
            localizeNumber(expectedMax.toString()),
        );
        await expect(
            component.getByTestId('@staking/form/withdrawal-warning'),
        ).toContainTranslation('TR_STAKE_LEFT_AMOUNT_FOR_WITHDRAWAL', {
            values: { amount: WITHDRAWAL_BUFFER, networkDisplaySymbol: 'ETH' },
        });
    });
});

test('switching to fiat converts the amount and back again', async ({ mount }) => {
    const component = await mount(STORY, { balance: BALANCE });
    const cryptoValue = '500';

    await component.getByTestId(cryptoInput).fill(cryptoValue);
    await component.getByTestId('@staking/form/switch-inputs').click();

    await expect(component.getByTestId('@staking/form/fiat-input')).toHaveValue(
        new BigNumber(cryptoValue).times(MOCK_ETH_RATE).toString(),
    );
    await expect(component.getByTestId('@staking/form/fiat-input/input-addon')).toHaveText('USD');

    await component.getByTestId('@staking/form/switch-inputs').click();

    await expect(component.getByTestId(cryptoInput)).toHaveValue(cryptoValue);
    await expect(component.getByTestId('@staking/form/crypto-input/input-addon')).toHaveText('ETH');
});
