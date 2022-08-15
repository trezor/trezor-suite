#!/usr/bin/env bash
# shellcheck disable=SC1078,SC1079,SC2027,SC2086 # TODO: the multiline string in TRX should be rewritten but I'm afraid to touch it

set -e
shopt -s expand_aliases

BTC_REC_ADDR=$1

if [ -z "$BTC_REC_ADDR" ]
then
      echo "Please fill in the recieving BTC address as the first arg."
else
  # Get unspent transactions
  UNSENT_TR=$( /usr/bin/bitcoin-cli -regtest -datadir=/root/.bitcoin --rpccookiefile=/root/.cookie -rpcport=18021 listunspent)
  # Get trxId of the last transaction
  TRX_ID=$(echo "$UNSENT_TR" | jq -r '.[-1].txid')

  # Create a btc transaction
  TRX=$(/usr/bin/bitcoin-cli -regtest -datadir=/root/.bitcoin --rpccookiefile=/root/.cookie -rpcport=18021 createrawtransaction \
  "[{
  \"txid\" : \""$TRX_ID"\",
  \"vout\" : 0
  }]" \
  "{\""$BTC_REC_ADDR"\": 49.99999}")

  # Sign the transaction
  TX_OUTPUT=$(/usr/bin/bitcoin-cli -regtest -datadir=/root/.bitcoin --rpccookiefile=/root/.cookie -rpcport=18021 signrawtransactionwithwallet "$TRX")

  # Broadcast the tx to the network
  HEX_ID=$(echo "$TX_OUTPUT" | jq -r '.hex')
  /usr/bin/bitcoin-cli -regtest -datadir=/root/.bitcoin --rpccookiefile=/root/.cookie -rpcport=18021 sendrawtransaction "$HEX_ID" &>/dev/null

  # Mine a new block
  ADDR=$(/usr/bin/bitcoin-cli -regtest -datadir=/root/.bitcoin --rpccookiefile=/root/.cookie -rpcport=18021 -rpcwallet=tenv-test getnewaddress)
  /usr/bin/bitcoin-cli -regtest -datadir=/root/.bitcoin --rpccookiefile=/root/.cookie -rpcport=18021 -rpcwallet=tenv-test generatetoaddress 150 "$ADDR" &>/dev/null
fi
