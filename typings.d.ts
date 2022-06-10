interface Window {
    bs58:Record<string,any>;
    bip39:Record<string,any>;
    nacl:Record<string,any>;
    ed25519:Record<string,any>;
    splToken:Record<string,any>;
    decimal:Record<string,any>;
    orca:Record<string,any>;
    web3:Record<string,any>;
    solanaWeb3:Record<string,any>;
    connection:Record<string,any>;
    owner:any;
    callMobileMethod:(method:string,data:Record<string,any>)=>{};
    createdMnemonic:()=>{
        mnemonics: string;
        coin: string;};
    createdAccount:(mnemonic: any) => { 
        address: string; 
        coin: string; 
        private_key: string; };
    importAccount:(privateKey: any)=> {
        address: string;
        coin: string;
        private_key: any;
    };
    transfer:(transferJsonStr: any)=> Promise<any>;
    initWallet:(privateKey: any, urls: any)=> void;
    swap:(type: any, dir: string | undefined, money: any)=> Promise<void>;
    getAllToken:(address: string)=> Promise<{}>;
    getTokenBalance:() =>  Promise<{}>;
    getSolBalance:() => Promise<{}>;
}

