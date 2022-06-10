import bs58 from "bs58";
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import * as ed25519 from "ed25519-hd-key";
import * as solanaWeb3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import Decimal from "decimal.js";
import { SOL, NFT, SPL} from '@zclubweb3/zclub-solana';
import { getOrca, Network, OrcaPoolConfig } from "@orca-so/sdk";

interface ItransferData { 
  type: string; // SOL|AHT|AUT|XNFT
  toAddress: string;
  amount?: string|number|bigint;
  nftId?: string;
  tokenId?: string;
}

const TOKENINFO = {
  "AHT":"",
  "AUT":"",
}


export const web3 = solanaWeb3;

const callMobileMethod = window.callMobileMethod;

// Here we take the first address directly, the network_path_code of solana is 501
// For example, the derived address we take here uses "m/44'/501'/0'/0'", you can also use other derived paths
// phantom default is “m/44'/501'/0'/0'”
const derivePath = "m/44'/501'/0'/0'";
//const derivePath = "m/44'/501'/0'";
/*
    generate mnemonic
    bip39.generateMnemonic
    byte    number of mnemonic words
    128 -> 12
    160 -> 15
    192 -> 18
    224 -> 21
    256 -> 24
*/
/**
 * @desc Create 12 mnemonic phrases
 */
export function createdMnemonic() {
  let mnemonic = bip39.generateMnemonic(
    128,
    undefined,
    bip39.wordlists.english
  );
  console.log("mnemonic", mnemonic);
  let json_data = {
    mnemonics: mnemonic,
    coin: "SOL",
  };
  callMobileMethod("onCreateMnemonics", json_data);
  return json_data;
}

/**
 * @desc Create wallet user by mnemonic
 *
 * @param mnemonic mnemonic string
 */
export function createdAccount(mnemonic: string) {
  // First get the seed according to the mnemonic
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const derivedSeed = ed25519.derivePath(derivePath, seed.toString("hex")).key;

  // get private key and address
  const privateKey = bs58.encode(
    nacl.sign.keyPair.fromSeed(derivedSeed).secretKey
  );
  const address = bs58.encode(
    nacl.sign.keyPair.fromSeed(derivedSeed).publicKey
  );
  let json_data = {
    address: address,
    coin: "SOL",
    private_key: privateKey,
  };
  callMobileMethod("onCreateAccount", json_data);
  return json_data;
}

/**
 * @desc Create account from key   There will be no mnemonic when importing an account through a private_key
 * @param privateKey   string after base58
 */
export function importAccount(privateKey:string) {
  const privateBuffer = bs58.decode(privateKey);
  const account = new web3.Account(privateBuffer);

  let json_data = {
    address: account.publicKey.toBase58(),
    coin: "SOL",
    private_key: privateKey,
  };
  callMobileMethod("onImportAccount", json_data);
  return json_data;
}

/**
 * @desc Connect to blockchain network & initialize wallet
 * @param privateKey string
 * @param urls url solana main network，test network，dev network
 * main https://api.mainnet-beta.solana.com/
 * test https://api.testnet.solana.com/
 * dev https://api.devnet.solana.com
 *
 * @return owner wallet account
 * */
let connection = new web3.Connection(
  "https://api.devnet.solana.com",
  "singleGossip"
);
let owner;
export function initWallet(privateKey:string, urls:string) {
  if (urls) {
    connection = new web3.Connection(urls, "singleGossip");
  }
  const secretKey = bs58.decode(privateKey);
  owner = web3.Keypair.fromSecretKey(secretKey);
  console.log("initWallet success");
  callMobileMethod("onInitWallet", {});
}

/**
 * @desc signature
 *
 * @param privateKey
 * @param address wallet account address
 * @param data Data that needs to be signed
 **/
async function sign(privateKey:string, address:string, data) {
  const secretKey = bs58.decode(privateKey);
  const publicKey = new web3.PublicKey(address);
  let recentBlockhash = await connection.getRecentBlockhash();
  let transaction = new web3.Transaction({
    recentBlockhash: recentBlockhash.blockhash,
    feePayer: publicKey,
  });
  transaction.add(data);
  let transactionBuffer = transaction.serializeMessage();
  let signature = nacl.sign.detached(transactionBuffer, secretKey);
  transaction.addSignature(publicKey, signature as Buffer);
  let rawTransaction = transaction.serialize();
  let json_data = {
    rawTransaction: rawTransaction,
  };
  callMobileMethod("onSign", json_data);
  return rawTransaction;
}

/**
 * @desc transfer
 * @return
 * success { transaction: "2BndzajSdrUtVHo1rUM9FHMBhXKuQzezJtrWindUVHUbBD81ehFw9wLf1LnxSQ7MQio6H5jnGVGkn2wHrMcEW5tt" }
 * */
export async function transfer(transferJsonStr:string) {
  try {
    let data = JSON.parse(transferJsonStr);
    console.log("transfer to " + data["toAddress"]);

    let res =await handleMultTransfer(data);

    let json_data = {
      transaction: res,
    };
    callMobileMethod("onTransfer", json_data);
    console.log("transfer", json_data);
    return json_data;
  } catch (e: any) {
    let json_data = {
      error: e.message,
    };
    callMobileMethod("onTransferFailed", json_data);
  }
}

/**
 * @desc Process different types of transactions
 * @param data 
 * @returns 
 */
async function handleMultTransfer(data:ItransferData) {
  let res;
  switch (data.type) {
    case "SOL":
      // sol forward to an address
      /*
                {
                  type:'0' //fixed
                  toAddress: '' //to wallet address
                  amount: 100 // number 
                }
            */
      res = await solTransfer(data);
      return res;
    case "XNFT":
      // nft to an address
      /*
                {
                    type:'1',
                    toAddress: '',// to wallet address
                    ntfId: '', // ntf address
                    amount: 100 // number
                }
            */
      res = await nftTransfer(data);
      return res;
    case "AUT":
    case "AHT":
      // spl token to an address
      /*
                {
                    type:'2',
                    toAddress: '',// to wallet address
                    tokenId: '', // token address
                    amount: 100 // number
                }
            */
      res = await splTransfer(data);
      return res;
    default:
      throw new Error("not match transfer type")
  }
}

/**
 *
 * @desc  sol transfer
 * for transfer
 * **/
async function solTransfer(data:ItransferData) {
  const encodedTx = await SOL.transfer(
    connection,
    owner,
    owner,
    new web3.PublicKey(data.toAddress),
    new Decimal(data.amount as string).mul(web3.LAMPORTS_PER_SOL).toNumber(),
  );
  const signature = await connection.sendEncodedTransaction(encodedTx);
  const res = await connection.confirmTransaction(signature);
  if(!res.value.err){
    return signature
  }else{
    throw new Error(res.value.err as string)
  }
}

async function nftTransfer(data:ItransferData) {
  const encodedTx = await NFT.transfer(
    connection,
    owner,
    owner,
    new web3.PublicKey(data.nftId as string),
    new web3.PublicKey(data.toAddress),
  );
  const signature = await connection.sendEncodedTransaction(encodedTx);
  const res = await connection.confirmTransaction(signature);
  if(!res.value.err){
    return signature
  }else{
    throw new Error(res.value.err as string)
  }
}

async function splTransfer(data:ItransferData){
  const encodedTx = await SPL.transfer(
    connection,
    owner,
    owner,
    new web3.PublicKey(TOKENINFO[data.type]||data.tokenId),
    new web3.PublicKey(data.toAddress),
    BigInt(new Decimal(data.amount as string).mul(web3.LAMPORTS_PER_SOL).toNumber()),
  );
  const signature = await connection.sendEncodedTransaction(encodedTx);
  const res = await connection.confirmTransaction(signature);
  if(!res.value.err){
    return signature
  }else{
    throw new Error(res.value.err as string)
  }
}

const poolInfo = {
  SOL_USDC: "sol_usdc",
  LUA_USDC: "lua_usdc",
  LUB_USDC: "lub_usdc",
};
/**
 * type
 * sol_usdc 0
 * lua_usdc 1
 * lub_usdc 2
 * sol_lua 3
 * sol_lub 4
 * lua_lub 5
 *
 * 0,1,2 direct swap
 * 3,4,5 need to use usdc to transfer
 * */
/**
 * @desc swap https://www.orca.so/
 *  token->usdc Tokens are directly traded with usdc
 *  token->token is exchange through usdc
 *
 * @param type  lua lub sol usdc
 * @param dir direction left right L->R R->L
 * @param money
 * @param slippage Acceptable slippage price 0.1 0.5(default) 1，custom
 *  more than 5 will prompt(your transaction may be frontrun) Less than 0.1 will prompt(your transaction may fail)
 * */
export async function swap(type, dir = "left", money) {
  if (!owner) {
    console.log("not owner");
    return;
  }
  const orca = getOrca(connection, Network.DEVNET);
  let orcaSolPool;
  let orcaSolPool2;
  if (Number(type) == 0) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
  } else if (Number(type) == 1) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 2) {
    orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 3) {
    if (dir == "left") {
      orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
    } else {
      orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    }
  } else if (Number(type) == 4) {
    if (dir == "left") {
      orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
    } else {
      orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    }
  } else if (Number(type) == 5) {
    if (dir == "left") {
      orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
    } else {
      orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
    }
  }
  let solToken;
  if (orcaSolPool2) {
    if (dir == "left") {
      solToken =
        dir === "left" ? orcaSolPool2.getTokenA() : orcaSolPool2.getTokenB();
    } else {
      solToken =
        dir === "left" ? orcaSolPool2.getTokenB() : orcaSolPool2.getTokenA();
    }
  } else {
    solToken =
      dir === "left" ? orcaSolPool.getTokenB() : orcaSolPool.getTokenA();
  }
  const amount = new Decimal(money);
  let quote;
  if (orcaSolPool2) {
    if (dir === "left") {
      quote = await orcaSolPool2.getQuote(solToken, amount).catch((e) => {
        console.error(e);
      });
    } else {
      quote = await orcaSolPool2.getQuote(solToken, amount).catch((e) => {
        console.error(e);
      });
    }
  } else {
    quote = await orcaSolPool.getQuote(solToken, amount).catch((e) => {
      console.error(e);
    });
  }
  const orcaAmount = quote.getMinOutputAmount();
  if (orcaSolPool2) {
    // gst => sol
    if (dir === "left") {
      const swapPayload2 = await orcaSolPool2
        .swap(owner, solToken, amount, orcaAmount)
        .catch((e) => {
          console.error(e);
        });
      const solToken2 =
        dir === "left" ? orcaSolPool.getTokenB() : orcaSolPool.getTokenA();
      console.log(orcaAmount.toNumber());
      const amount2 = new Decimal(orcaAmount.toNumber());
      const quote2 = await orcaSolPool
        .getQuote(solToken2, amount2)
        .catch((e) => {
          console.error(e);
        });
      try {
        const orcaAmount2 = quote2.getMinOutputAmount();
        console.log(orcaAmount2.toNumber());
        const swapPayload = await orcaSolPool
          .swap(owner, solToken2, amount2, orcaAmount2)
          .catch((e) => {
            console.error(e);
          });
        if (dir === "left") {
          swapPayload2.transaction.add(swapPayload.transaction);
          swapPayload2.signers.push(...swapPayload.signers);
          const swapTxId = await swapPayload2.execute().catch((e) => {
            console.error(e);
          });
          console.log({ swap: swapTxId });
        } else {
          swapPayload.transaction.add(swapPayload2.transaction);
          swapPayload.signers.push(...swapPayload2.signers);
          const swapTxId = await swapPayload.execute().catch((e) => {
            console.error(e);
          });
          console.log({ swap: swapTxId });
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      const swapPayload = await orcaSolPool2
        .swap(owner, solToken, amount, orcaAmount)
        .catch((e) => {
          console.error(e);
        });
      const solToken2 =
        dir === "left" ? orcaSolPool.getTokenA() : orcaSolPool.getTokenB();
      const amount2 = new Decimal(orcaAmount.toNumber());
      const quote2 = await orcaSolPool
        .getQuote(solToken2, amount2)
        .catch((e) => {
          console.error(e);
        });
      try {
        const orcaAmount2 = quote2.getMinOutputAmount();
        const swapPayload2 = await orcaSolPool
          .swap(owner, solToken2, amount2, orcaAmount2)
          .catch((e) => {
            console.error(e);
          });
        console.log(dir, orcaAmount2.toNumber());
        if (dir === "left") {
          swapPayload2.transaction.add(swapPayload.transaction);
          swapPayload2.signers.push(...swapPayload.signers);
          const swapTxId = await swapPayload2.execute().catch((e) => {
            console.error(e);
          });
          console.log({ swap: swapTxId });
        } else {
          swapPayload.transaction.add(swapPayload2.transaction);
          swapPayload.signers.push(...swapPayload2.signers);
          const swapTxId = await swapPayload.execute().catch((e) => {
            console.error(e);
          });
          console.log({ swap: swapTxId });
        }
      } catch (e) {
        console.error(e);
      }
    }
  } else {
    console.log(amount.toNumber(), orcaAmount.toNumber(), solToken.name);
    const swapPayload = await orcaSolPool
      .swap(owner, solToken, amount, orcaAmount)
      .catch((e) => {
        console.error(e);
      });
    const swapTxId = await swapPayload.execute().catch((e) => {
      console.error(e);
    });
    console.log({ swap: swapTxId });
  }
}

/**
 * Check the required fee
 * @param type same with swap type
 * */
export async function getFee(type) {
  const orca = getOrca(connection, Network.DEVNET);
  let orcaSolPool;
  let orcaSolPool2;
  if (Number(type) == 0) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
  } else if (Number(type) == 1) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 2) {
    orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 3) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 4) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 5) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  }
  if (!orcaSolPool2) {
    const solToken = orcaSolPool.getTokenA();
    const amount = new Decimal(1);
    const quote = await orcaSolPool.getQuote(solToken, amount);
    const s1 = await quote.getLPFees();
    console.log({ fee: s1.toNumber().toString() });
  } else {
    const solToken = orcaSolPool.getTokenA();
    const amount = new Decimal(1);
    const quote = await orcaSolPool.getQuote(solToken, amount);
    const s1 = await quote.getLPFees();
    const solToken2 = orcaSolPool2.getTokenA();
    const amount2 = new Decimal(1);
    const quote2 = await orcaSolPool2.getQuote(solToken2, amount2);
    const s2 = await quote2.getLPFees();
    const num = s1.toNumber() + s2.toNumber();
    console.log({ fee: num.toString() });
  }
}

/** @type
 * @getPrice
 * Query 1 exchange price
 */

export async function getPrice(type, money = 1, dir = "left") {
  const orca = getOrca(connection, Network.DEVNET);
  let orcaSolPool;
  let orcaSolPool2;
  if (Number(type) == 0) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
  } else if (Number(type) == 1) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 2) {
    orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 3) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 4) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 5) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  }
  if (!orcaSolPool2) {
    const solTokenB = orcaSolPool.getTokenB();
    const solTokenA = orcaSolPool.getTokenA();
    const amount = new Decimal(money);
    const quote = await orcaSolPool.getQuote(solTokenB, amount);
    const quotea = await orcaSolPool.getQuote(solTokenA, amount);
    const rate = await quote.getRate();
    const rate1 = await quotea.getRate();
    console.log({
      tokenA: rate1.toNumber().toString(),
      tokenB: rate.toNumber().toString(),
      type,
      getPrice: "getPrice",
    });
  } else {
    const solTokenA = orcaSolPool.getTokenA();
    const solTokenB = orcaSolPool.getTokenB();
    const amountA = new Decimal(money);
    const quoteA = await orcaSolPool.getQuote(solTokenA, amountA);

    const solToken2A = orcaSolPool2.getTokenA();
    const solToken2B = orcaSolPool2.getTokenB();
    const amount3 = new Decimal(money);

    const quote2A = await orcaSolPool2.getQuote(solToken2A, amount3);
    const quote2B = await orcaSolPool2.getQuote(solToken2B, amount3);
    const quoteB = await orcaSolPool.getQuote(solTokenB, amountA);
    const rate = await quoteA.getRate();

    const rateB = await quoteB.getRate();

    const rate2 = await quote2A.getRate();
    const rate2B = await quote2B.getRate();
    console.log({
      tokenB: rate2B.mul(rate).toNumber().toString(),
      tokenA: rate2.mul(rateB).toNumber().toString(),
      type,
      getPrice: "getPrice",
    });
  }
}

/***
 * @getAllToken
 *
 * @param address account address
 * @description get all token
 */
export async function getAllToken(address: string) {
  const { AccountLayout, TOKEN_PROGRAM_ID } = splToken;
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    new web3.PublicKey(address),
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );
  const tokenInfo = {};
  tokenAccounts.value.forEach((e) => {
    const accountInfo = AccountLayout.decode(e.account.data);
    tokenInfo[new web3.PublicKey(accountInfo.mint).toBase58()] =
      accountInfo.amount;
  });
  return tokenInfo;
}

/***
 * @getTokenBalance
 *
 * @description Get all token information of the current user
 */
export async function getTokenBalance(){
  const allInfo = await SPL.getAllTokenBalance(
    connection,
    owner.publicKey,
  );
  const json_data = allInfo;
  callMobileMethod("onGetTokenBalance", json_data);
  return allInfo;
}

/***
 * @getTokenBalance
 *
 * @description Get sol amount of the current user
 */
export async function getSolBalance(){
  const balance = await SOL.getBalance(connection, owner.publicKey);
  const json_data = {
    SOL:new Decimal(balance.toString()).div(web3.LAMPORTS_PER_SOL).toNumber()
  }
  callMobileMethod("onGetSolBalance", json_data);
  return balance;
}

window.web3 = web3;
window.solanaWeb3 = web3;
window.bs58 = bs58;
window.connection = connection;
window.createdMnemonic = createdMnemonic;
window.createdAccount = createdAccount;
window.importAccount = importAccount;
window.transfer = transfer;
window.initWallet = initWallet;
window.swap = swap;
window.getAllToken = getAllToken;
window.getTokenBalance = getTokenBalance;
window.getSolBalance = getSolBalance;

/**
 *
 * web3.PublicKe Convert address string to raw format
 * bs58.decode Convert key string to raw format
 */
