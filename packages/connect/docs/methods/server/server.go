package main

import (
	_sha256 "crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"

	"github.com/btcsuite/btcd/btcec"
)

func main() {
	challengeHidden := "cd8552569d6e4509266ef137584d1e62c7579b5b8ed69bbafa4b864c6521e7c2" // Use random value
	challengeVisual := "2015-03-23 17:39:22"
	publicKey := "023a472219ad3327b07c18273717bb3a40b39b743756bf287fbd5fa9d263237f45"
	signature := "20f2d1a42d08c3a362be49275c3ffeeaa415fc040971985548b9f910812237bb41770bf2c8d488428799fbb7e52c11f1a3404011375e4080e077e0e42ab7a5ba02"

	err := verify(challengeHidden, challengeVisual, publicKey, signature, 2)
	if err != nil {
		log.Fatalln(err)
	}

	println("signature is valid")
}

func verify(challengeHidden, challengeVisual, publicKey, signature string, version int) error {
	challengeHiddenBytes, err := hex.DecodeString(challengeHidden)
	if err != nil {
		return fmt.Errorf("failed to decode challenge hidden: %v", err)
	}

	challengeVisualBytes := []byte(challengeVisual)

	publicKeyBytes, err := hex.DecodeString(publicKey)
	if err != nil {
		return fmt.Errorf("failed to decode public key: %v", err)
	}

	pubKey, err := btcec.ParsePubKey(publicKeyBytes, btcec.S256())
	if err != nil {
		return fmt.Errorf("failed to parse public key: %v", err)
	}

	signatureBytes, err := hex.DecodeString(signature)
	if err != nil {
		return fmt.Errorf("failed to decode signature: %v", err)
	}

	var challenge []byte
	switch version {
	case 1:
		challenge = append(challengeHiddenBytes, challengeVisualBytes...)
	case 2:
		challenge = append(sha256(challengeHiddenBytes), sha256(challengeVisualBytes)...)
	default:
		return fmt.Errorf("unknown version: %d", version)
	}

	magicBytes := []byte("Bitcoin Signed Message:\n")

	var msg []byte
	msg = append(msg, byte(len(magicBytes)))
	msg = append(msg, magicBytes...)
	msg = append(msg, byte(len(challenge)))
	msg = append(msg, challenge...)
	hash := sha256(sha256(msg))

	recoveredKey, _, err := btcec.RecoverCompact(btcec.S256(), signatureBytes, hash)
	if err != nil {
		return errors.New("failed to verify signature")
	}

	if !recoveredKey.IsEqual(pubKey) {
		return errors.New("signature does not match public key or challenge")
	}

	return nil
}

func sha256(msg []byte) []byte {
	hash := _sha256.Sum256(msg)
	return hash[:]
}
