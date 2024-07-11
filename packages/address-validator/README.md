# trezor-address-validator
Simple wallet address validator for validating Bitcoin and other altcoins addresses in **Node.js and browser**.

Forked from [ryanralph/altcoin-address](https://github.com/ryanralph/altcoin-address).

**File size is ~65 kB (minifed and gzipped)**.

## Installation

### NPM
```
npm install trezor-address-validator
```

### Browser
```html
<script src="wallet-address-validator.min.js"></script>
```

## API

##### validate (address [, currency = 'bitcoin'[, networkType = 'prod']])

###### Parameters
* address - Wallet address to validate.
* currency - Optional. Currency name or symbol, e.g. `'bitcoin'` (default), `'litecoin'` or `'LTC'`
* networkType - Optional. Use `'prod'` (default) to enforce standard address, `'testnet'` to enforce testnet address and `'both'` to enforce nothing.

> Returns true if the address (string) is a valid wallet address for the crypto currency specified, see below for supported currencies.


##### getAddressType (address [, currency = 'bitcoin'[, networkType = 'prod']])

###### Parameters
* address - Wallet address to validate.
* currency - Optional. Currency name or symbol, e.g. `'bitcoin'` (default), `'litecoin'` or `'LTC'`
* networkType - Optional. Use `'prod'` (default) to enforce standard address, `'testnet'` to enforce testnet address and `'both'` to enforce nothing.

> Returns address type (`'address' | 'p2pkh' | 'p2wpkh' | 'p2wsh' | 'p2sh' | 'p2tr' | 'pw-unknown'`) of the address or `undefined` if the address is invalid.
### Supported crypto currencies

* 0x/zrx `'0x'` or `'zrx'`
* Aave/lend `'Aave'` or `'lend'`
* Abyss Token/abyss `'Abyss Token'` or `'abyss'`
* AdEx/adx `'AdEx'` or `'adx'`
* adToken/adt `'adToken'` or `'adt'`
* aelf/elf `'aelf'` or `'elf'`
* Aeron/arn `'Aeron'` or `'arn'`
* Aeternity/ae `'Aeternity'` or `'ae'`
* Agrello/dlt `'Agrello'` or `'dlt'`
* All Sports/soc `'All Sports'` or `'soc'`
* Ambrosus/amb `'Ambrosus'` or `'amb'`
* Ankr/ankr `'Ankr'` or `'ankr'`
* AppCoins/appc `'AppCoins'` or `'appc'`
* Aragon/ant `'Aragon'` or `'ant'`
* Arcblock/abt `'Arcblock'` or `'abt'`
* Ardor/ardr `'Ardor'` or `'ardr'`
* ATLANT/atl `'ATLANT'` or `'atl'`
* Augur/rep `'Augur'` or `'rep'`
* AuroraCoin/aur `'AuroraCoin'` or `'aur'`
* aXpire/axpr `'aXpire'` or `'axpr'`
* Bancor/bnt `'Bancor'` or `'bnt'`
* Band Protocol/band `'Band Protocol'` or `'band'`
* Bankex/bkx `'Bankex'` or `'bkx'`
* Basic Attention Token/bat `'Basic Attention Token'` or `'bat'`
* BeaverCoin/bvc `'BeaverCoin'` or `'bvc'`
* BetterBetting/betr `'BetterBetting'` or `'betr'`
* Binance/bnb `'Binance'` or `'bnb'`
* Binance Smart Chain/bsc `'Binance Smart Chain'` or `'bsc'`
* Binance USD/busd `'Binance USD'` or `'busd'`
* BioCoin/bio `'BioCoin'` or `'bio'`
* Bitcoin/btc `'Bitcoin'` or `'btc'`
* Bitcoin Diamond/bcd `'Bitcoin Diamond'` or `'bcd'`
* Bitcoin SV/bsv `'Bitcoin SV'` or `'bsv'`
* BitcoinCash/bch `'BitcoinCash'` or `'bch'`
* BitcoinGold/btg `'BitcoinGold'` or `'btg'`
* BitcoinPrivate/btcp `'BitcoinPrivate'` or `'btcp'`
* BitcoinZ/btcz `'BitcoinZ'` or `'btcz'`
* BitDegree/bdg `'BitDegree'` or `'bdg'`
* BitKan/kan `'BitKan'` or `'kan'`
* BlitzPredict/xbp `'BlitzPredict'` or `'xbp'`
* Blockmason Credit Protocol/bcpt `'Blockmason Credit Protocol'` or `'bcpt'`
* Blocktrade Token/btt `'Blocktrade Token'` or `'btt'`
* BLOCKv/vee `'BLOCKv'` or `'vee'`
* Blox/cdt `'Blox'` or `'cdt'`
* Bluzelle/blz `'Bluzelle'` or `'blz'`
* Bread/brd `'Bread'` or `'brd'`
* BTU Protocol/btu `'BTU Protocol'` or `'btu'`
* Callisto/clo `'Callisto'` or `'clo'`
* Cardano/ada `'Cardano'` or `'ada'`
* Celer Network/celr `'Celer Network'` or `'celr'`
* Chainlink/link `'Chainlink'` or `'link'`
* Chiliz/chz `'Chiliz'` or `'chz'`
* Chronobank/time `'Chronobank'` or `'time'`
* Cindicator/cnd `'Cindicator'` or `'cnd'`
* Civic/cvc `'Civic'` or `'cvc'`
* Cocos-BCX/cocos `'Cocos-BCX'` or `'cocos'`
* Coinlancer/cl `'Coinlancer'` or `'cl'`
* COS/cos `'COS'` or `'cos'`
* Cosmo Coin/cosm `'Cosmo Coin'` or `'cosm'`
* Cosmos/atom `'Cosmos'` or `'atom'`
* Covesting/cov `'Covesting'` or `'cov'`
* Cred/lba `'Cred'` or `'lba'`
* Crypterium/crpt `'Crypterium'` or `'crpt'`
* Crypto.com Coin/cro `'Crypto.com Coin'` or `'cro'`
* CryptoBossCoin/cbc `'CryptoBossCoin'` or `'cbc'`
* CryptoFranc/xchf `'CryptoFranc'` or `'xchf'`
* Daneel/dan `'Daneel'` or `'dan'`
* Dash/dash `'Dash'` or `'dash'`
* Decentraland/mana `'Decentraland'` or `'mana'`
* Decred/dcr `'Decred'` or `'dcr'`
* Dent/dent `'Dent'` or `'dent'`
* Dentacoin/dcn `'Dentacoin'` or `'dcn'`
* DigiByte/dgb `'DigiByte'` or `'dgb'`
* Digitex Futures/dgtx `'Digitex Futures'` or `'dgtx'`
* DigixDAO/dgd `'DigixDAO'` or `'dgd'`
* District0x/dnt `'District0x'` or `'dnt'`
* Dock/dock `'Dock'` or `'dock'`
* DogeCoin/doge `'DogeCoin'` or `'doge'`
* DomRaider/drt `'DomRaider'` or `'drt'`
* Dusk Network/dusk `'Dusk Network'` or `'dusk'`
* Edgeless/edg `'Edgeless'` or `'edg'`
* Eidoo/edo `'Eidoo'` or `'edo'`
* Electrify.Asia/elec `'Electrify.Asia'` or `'elec'`
* Enigma/eng `'Enigma'` or `'eng'`
* Enjin Coin/enj `'Enjin Coin'` or `'enj'`
* EOS/eos `'EOS'` or `'eos'`
* Ethereum/eth `'Ethereum'` or `'eth'`
* EthereumClassic/etc `'EthereumClassic'` or `'etc'`
* Etherparty/fuel `'Etherparty'` or `'fuel'`
* EtherZero/etz `'EtherZero'` or `'etz'`
* Everex/evx `'Everex'` or `'evx'`
* Exchange Union/xuc `'Exchange Union'` or `'xuc'`
* Expanse/exp `'Expanse'` or `'exp'`
* Fantom/ftm `'Fantom'` or `'ftm'`
* Fetch.ai/fet `'Fetch.ai'` or `'fet'`
* FirmaChain/fct `'FirmaChain'` or `'fct'`
* FirstBlood/1st `'FirstBlood'` or `'1st'`
* Fortuna/fota `'Fortuna'` or `'fota'`
* FreiCoin/frc `'FreiCoin'` or `'frc'`
* GameCredits/game `'GameCredits'` or `'game'`
* GarliCoin/grlc `'GarliCoin'` or `'grlc'`
* Gemini Dollar/gusd `'Gemini Dollar'` or `'gusd'`
* Genesis Vision/gvt `'Genesis Vision'` or `'gvt'`
* Gifto/gto `'Gifto'` or `'gto'`
* Gnosis/gno `'Gnosis'` or `'gno'`
* Golem/gnt `'Golem'` or `'gnt'`
* Groestlcoin/grs `'Groestlcoin'` or `'grs'`
* Hedera Hashgraph/hbar `'Hedera Hashgraph'` or `'hbar'`
* HedgeTrade/hedg `'HedgeTrade'` or `'hedg'`
* Holo/hot `'Holo'` or `'hot'`
* HOQU/hqx `'HOQU'` or `'hqx'`
* Humaniq/hmq `'Humaniq'` or `'hmq'`
* Huobi Token/ht `'Huobi Token'` or `'ht'`
* Hush/hush `'Hush'` or `'hush'`
* HyperSpace/xsc `'HyperSpace'` or `'xsc'`
* ICON/icx `'ICON'` or `'icx'`
* iExec RLC/rlc `'iExec RLC'` or `'rlc'`
* IHT Real Estate Protocol/iht `'IHT Real Estate Protocol'` or `'iht'`
* Insolar/ins `'Insolar'` or `'ins'`
* Internet of Services/IOST `'Internet of Services'` or `'IOST'`
* Iota/iota `'Iota'` or `'iota'`
* IoTeX/iotx `'IoTeX'` or `'iotx'`
* Kcash/kcash `'Kcash'` or `'kcash'`
* KEY/key `'KEY'` or `'key'`
* KickToken/kick `'KickToken'` or `'kick'`
* Komodo/kmd `'Komodo'` or `'kmd'`
* Kyber Network/knc `'Kyber Network'` or `'knc'`
* Lambda/lamb `'Lambda'` or `'lamb'`
* Lamden/tau `'Lamden'` or `'tau'`
* LBRY Credits/lbc `'LBRY Credits'` or `'lbc'`
* LIFE/life `'LIFE'` or `'life'`
* LinkEye/let `'LinkEye'` or `'let'`
* Lisk/lsk `'Lisk'` or `'lsk'`
* LiteCoin/ltc `'LiteCoin'` or `'ltc'`
* LockTrip/loc `'LockTrip'` or `'loc'`
* Loki/loki `'Loki'` or `'loki'`
* Loom Network/loom `'Loom Network'` or `'loom'`
* Loopring/lrc `'Loopring'` or `'lrc'`
* Luniverse/luniverse `'Luniverse'` or `'luniverse'`
* Lunyr/lun `'Lunyr'` or `'lun'`
* Mainframe/mft `'Mainframe'` or `'mft'`
* Maker/mkr `'Maker'` or `'mkr'`
* Matchpool/gup `'Matchpool'` or `'gup'`
* Matic Network/matic `'Matic Network'` or `'matic'`
* MCO/mco `'MCO'` or `'mco'`
* Measurable Data Token/mdt `'Measurable Data Token'` or `'mdt'`
* MegaCoin/mec `'MegaCoin'` or `'mec'`
* Melon/mln `'Melon'` or `'mln'`
* Menlo One/one `'Menlo One'` or `'one'`
* Metal/mtl `'Metal'` or `'mtl'`
* Mithril/mith `'Mithril'` or `'mith'`
* Moeda Loyalty Points/mda `'Moeda Loyalty Points'` or `'mda'`
* Molecular Future/mof `'Molecular Future'` or `'mof'`
* MonaCoin/mona `'MonaCoin'` or `'mona'`
* Monero/xmr `'Monero'` or `'xmr'`
* Monetha/mth `'Monetha'` or `'mth'`
* Monolith/tkn `'Monolith'` or `'tkn'`
* Multi-collateral DAI/dai `'Multi-collateral DAI'` or `'dai'`
* Mysterium/myst `'Mysterium'` or `'myst'`
* NAGA/ngc `'NAGA'` or `'ngc'`
* NameCoin/nmc `'NameCoin'` or `'nmc'`
* Nano/nano `'Nano'` or `'nano'`
* Nem/xem `'Nem'` or `'xem'`
* Neo/neo `'Neo'` or `'neo'`
* NeoGas/gas `'NeoGas'` or `'gas'`
* NetKoin/ntk `'NetKoin'` or `'ntk'`
* Nexo/nexo `'Nexo'` or `'nexo'`
* Noah Coin/noah `'Noah Coin'` or `'noah'`
* Nucleus Vision/ncash `'Nucleus Vision'` or `'ncash'`
* Numeraire/nmr `'Numeraire'` or `'nmr'`
* NXT/nxt `'NXT'` or `'nxt'`
* OAX/oax `'OAX'` or `'oax'`
* Ocean Protocol/ocean `'Ocean Protocol'` or `'ocean'`
* Odyssey/ocn `'Odyssey'` or `'ocn'`
* OmiseGO/omg `'OmiseGO'` or `'omg'`
* Ontology/ont `'Ontology'` or `'ont'`
* ORS Group/ors `'ORS Group'` or `'ors'`
* OST/ost `'OST'` or `'ost'`
* Own/chx `'Own'` or `'chx'`
* Patientory/ptoy `'Patientory'` or `'ptoy'`
* Patron/pat `'Patron'` or `'pat'`
* Paxos Standard/pax `'Paxos Standard'` or `'pax'`
* Peculium/pcl `'Peculium'` or `'pcl'`
* PeerCoin/ppc `'PeerCoin'` or `'ppc'`
* Perlin/perl `'Perlin'` or `'perl'`
* Pillar/plr `'Pillar'` or `'plr'`
* PIVX/pivx `'PIVX'` or `'pivx'`
* Po.et/poe `'Po.et'` or `'poe'`
* Polymath/poly `'Polymath'` or `'poly'`
* Populous/ppt `'Populous'` or `'ppt'`
* Power Ledger/powr `'Power Ledger'` or `'powr'`
* Presearch/pre `'Presearch'` or `'pre'`
* PrimeCoin/xpm `'PrimeCoin'` or `'xpm'`
* ProtoShares/pts `'ProtoShares'` or `'pts'`
* PumaPay/pma `'PumaPay'` or `'pma'`
* Pundi X/npxs `'Pundi X'` or `'npxs'`
* Qtum/qtum `'Qtum'` or `'qtum'`
* Quant/qnt `'Quant'` or `'qnt'`
* Quantstamp/qsp `'Quantstamp'` or `'qsp'`
* QuarkChain/qkc `'QuarkChain'` or `'qkc'`
* RaiBlocks/xrb `'RaiBlocks'` or `'xrb'`
* Raiden Network Token/rdn `'Raiden Network Token'` or `'rdn'`
* Ravencoin/rvn `'Ravencoin'` or `'rvn'`
* Refereum/rfr `'Refereum'` or `'rfr'`
* Ren/ren `'Ren'` or `'ren'`
* Request/req `'Request'` or `'req'`
* Revain/r `'Revain'` or `'r'`
* Ripio Credit Network/rcn `'Ripio Credit Network'` or `'rcn'`
* Ripple/xrp `'Ripple'` or `'xrp'`
* Salt/salt `'Salt'` or `'salt'`
* Scopuly/sky `'Scopuly'` or `'sky'`
* Sentinel/sent `'Sentinel'` or `'sent'`
* SiaCashCoin/scc `'SiaCashCoin'` or `'scc'`
* Siacoin/sc `'Siacoin'` or `'sc'`
* SingularDTV/sngls `'SingularDTV'` or `'sngls'`
* SingularityNET/agi `'SingularityNET'` or `'agi'`
* SIRIN LABS Token/srn `'SIRIN LABS Token'` or `'srn'`
* SkinCoin/skin `'SkinCoin'` or `'skin'`
* SnowGem/sng `'SnowGem'` or `'sng'`
* Solana/sol `'Solana'` or `'sol'`
* SolarCoin/slr `'SolarCoin'` or `'slr'`
* SOLVE/solve `'SOLVE'` or `'solve'`
* SoMee.Social/ong `'SoMee.Social'` or `'ong'`
* SONM/snm `'SONM'` or `'snm'`
* Spendcoin/spnd `'Spendcoin'` or `'spnd'`
* STASIS EURO/eurs `'STASIS EURO'` or `'eurs'`
* Status/snt `'Status'` or `'snt'`
* STEEM/steem `'STEEM'` or `'steem'`
* Stellar/xlm `'Stellar'` or `'xlm'`
* Storj/storj `'Storj'` or `'storj'`
* Storm/storm `'Storm'` or `'storm'`
* Stox/stx `'Stox'` or `'stx'`
* Stratis/strat `'Stratis'` or `'strat'`
* Streamr DATAcoin/data `'Streamr DATAcoin'` or `'data'`
* Substratum/sub `'Substratum'` or `'sub'`
* SunContract/snc `'SunContract'` or `'snc'`
* Swarm City/swt `'Swarm City'` or `'swt'`
* SwftCoin/swftc `'SwftCoin'` or `'swftc'`
* Synthetix Network/snx `'Synthetix Network'` or `'snx'`
* Syscoin/sys `'Syscoin'` or `'sys'`
* Tael/wabi `'Tael'` or `'wabi'`
* Telcoin/tel `'Telcoin'` or `'tel'`
* TEMCO/temco `'TEMCO'` or `'temco'`
* TenX/pay `'TenX'` or `'pay'`
* Tether/usdt `'Tether'` or `'usdt'`
* Tezos/xtz `'Tezos'` or `'xtz'`
* Tierion/tnt `'Tierion'` or `'tnt'`
* Time New Bank/tnb `'Time New Bank'` or `'tnb'`
* Tripio/trio `'Tripio'` or `'trio'`
* Tron/trx `'Tron'` or `'trx'`
* TrueUSD/tusd `'TrueUSD'` or `'tusd'`
* USD Coin/usdc `'USD Coin'` or `'usdc'`
* USDT ERC-20/usdt20 `'USDT ERC-20'` or `'usdt20'`
* Utrust/utk `'Utrust'` or `'utk'`
* VeChain/ven `'VeChain'` or `'ven'`
* VeChain Mainnet/vet `'VeChain Mainnet'` or `'vet'`
* Verge/xvg `'Verge'` or `'xvg'`
* VertCoin/vtc `'VertCoin'` or `'vtc'`
* VIBE/vibe `'VIBE'` or `'vibe'`
* Viberate/vib `'Viberate'` or `'vib'`
* VoteCoin/vot `'VoteCoin'` or `'vot'`
* Waltonchain/wtc `'Waltonchain'` or `'wtc'`
* Waves/waves `'Waves'` or `'waves'`
* WePower/wpr `'WePower'` or `'wpr'`
* WeTrust/trst `'WeTrust'` or `'trst'`
* Wings/wings `'Wings'` or `'wings'`
* YOU COIN/you `'YOU COIN'` or `'you'`
* Zap/zap `'Zap'` or `'zap'`
* ZCash/zec `'ZCash'` or `'zec'`
* ZClassic/zcl `'ZClassic'` or `'zcl'`
* ZenCash/zen `'ZenCash'` or `'zen'`
* Zilliqa/zil `'Zilliqa'` or `'zil'`

### Usage example

#### Node
```javascript
var WAValidator = require('trezor-address-validator');

var valid = WAValidator.validate('1KFzzGtDdnq5hrwxXGjwVnKzRbvf8WVxck', 'BTC');
if(valid)
	console.log('This is a valid address');
else
	console.log('Address INVALID');

// This will log 'This is a valid address' to the console.
```

```javascript
var WAValidator = require('trezor-address-validator');

var valid = WAValidator.validate('1KFzzGtDdnq5hrwxXGjwVnKzRbvf8WVxck', 'litecoin', 'testnet');
if(valid)
      console.log('This is a valid address');
else
      console.log('Address INVALID');

// As this is a invalid litecoin address 'Address INVALID' will be logged to console.
```

```javascript
var WAValidator = require('trezor-address-validator');

var currency = WAValidator.findCurrency('xrp');
if(currency)
      console.log('This currency exists');
else
      console.log('Currency INVALID');

// As this is a valid currency symbol 'This currency exists' will be logged to console.
```

```javascript
var WAValidator = require('trezor-address-validator');

var currency = WAValidator.findCurrency('random');
if(currency)
      console.log('This currency exists');
else
      console.log('Currency INVALID');

// As this is not a valid currency symbol 'Currency INVALID' will be logged to console.
```
#### Browser
```html
<script src="wallet-address-validator.min.js"></script>
```

```javascript
// WAValidator is exposed as a global (window.WAValidator)
var valid = WAValidator.validate('1KFzzGtDdnq5hrwxXGjwVnKzRbvf8WVxck', 'bitcoin');
if(valid)
    alert('This is a valid address');
else
    alert('Address INVALID');

// This should show a pop up with text 'This is a valid address'.
```
