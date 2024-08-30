// Exclude coins that are not supported by any device model during yarn update-coins
import fs from 'fs';

const coinsJsonPath = './packages/connect-common/files/coins.json';
const coinsData: Record<string, { support: Record<string, string | boolean> }[]> = JSON.parse(
    fs.readFileSync(coinsJsonPath, 'utf-8'),
);

const filteredCoins = Object.fromEntries(
    Object.entries(coinsData).map(([key, value]) => [
        key,
        value.filter(
            coin => !Object.values(coin.support).every(deviceModel => deviceModel === false),
        ),
    ]),
);

fs.writeFileSync(coinsJsonPath, JSON.stringify(filteredCoins));
