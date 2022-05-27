const bs58 = require("bs58")
const bip39 = require('bip39')
const nacl = require("tweetnacl") // nacl
const ed25519 = require('ed25519-hd-key')
const solanaWeb3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const decimal = require('decimal.js')
const orca = require('@orca-so/sdk')

window.Buffer = require('buffer').Buffer;
window.bs58 = bs58;
window.bip39 = bip39;
window.nacl = nacl;
window.ed25519 = ed25519;
window.solanaWeb3 = solanaWeb3;
window.splToken = splToken;
window.decimal = decimal;
window.orca = orca;
