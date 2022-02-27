
import { Keypair, PublicKey, SystemProgram, Connection } from '@solana/web3.js';
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    MintLayout,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { 
    TOKEN_METADATA_PROGRAM_ID,
    MINTS_ROUTE
} from '../utils/constants';
import { 
    getAssociatedTokenAddress,
    createTransferInstruction,
    getOrCreateAssociatedTokenAccount
} from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';


export const transferMint = async (
    connection: Connection,
    feePayer: Keypair,
    customer: PublicKey,
    mint: PublicKey
): Promise<string | null> => {

    console.log('transfer feePayer -> ', feePayer.publicKey.toBase58())
    console.log('transfer mint -> ' , mint.toBase58())
    console.log('transfer customer -> ', customer.toBase58())

    const trx = new web3.Transaction();

    // merchant's ATA currently holding mint
    const fromATA = await getOrCreateAssociatedTokenAccount(
        connection,
        feePayer,
        mint,
        feePayer.publicKey,
        undefined,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log('fromATA -> ', fromATA.address.toBase58())

    // customer's ATA to hold mint
    const toATA = await getOrCreateAssociatedTokenAccount(
        connection,
        feePayer,
        mint,
        customer,
        undefined,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID 
    )
    console.log('toATA -> ', toATA.address.toBase58())

    // Add token transfer instructions to transaction
    trx.add(
        createTransferInstruction(
            fromATA.address,
            toATA.address,
            feePayer.publicKey,
            1,
        )
    );
    
    if (fromATA && toATA) {
        const confirm = await connection.sendTransaction(trx, [feePayer])

        if (confirm) {
            console.log('Mint transfer succeeded!')
            return confirm;
        } else {
            console.log('Mint transfer failed to confirm')
            return null;
        }
    } else {
        console.log('ERROR: Failed to create token accounts!')
        return null;
    }
}


export const getTokenWallet = async (
  wallet: web3.PublicKey,
  mint: web3.PublicKey
) => {
  return (
    await web3.PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0];
};

export const fetchMetadata = async (nftMintKey: PublicKey) => {
  const metadataBuffer = Buffer.from("metadata");

  // Fetches metadata account from PDA
  return (
      await PublicKey.findProgramAddress(
          [
            metadataBuffer,
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            nftMintKey.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
      )
  )[0];
};

export const getMint = async (trx: string): Promise<PublicKey | null> => {
    const route = MINTS_ROUTE + '/valid';
    const validMints = await (await fetch(route, {method: "Get"})).json();
    console.log('VALID MINTS: ', validMints)
    console.log('TRX: ', trx)

    const mint = validMints[validMints.length - 1].mint.toString();

    const item = {
        mint: mint,
        used: true,
        trx: trx.toString()
    }

    if (mint) {      
        console.log('trx.....')   
        // update merchant mints on server
        // adds transferred mint to list of used NFTs
        const route = MINTS_ROUTE + `/${mint}`
        await fetch(route, {
            method: 'PUT',
            headers: {
                'Content-Type':'application/json',
                'Accept':'application/json'
            },
            body: JSON.stringify(item)
        })
        return new PublicKey(mint);
    } else {
        return null;
    }
};

export const InitMerchant = async (
    connection: Connection,
    wallet: PublicKey,
) => {

    const walletString = wallet.toBase58().toString()

    const accounts = await connection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID, 
        {
            filters: [{
                dataSize: 165, // number of bytes
            },
            {
                memcmp: {
                    offset: 32, // number of bytes
                    bytes: walletString, // base58 encoded string
                },
            }],
        }
    );

    let mint;
    let balance;
    let i = 0;

    accounts.forEach(async (
        account: any
    ) => {
        balance = account.account.data["parsed"]["info"]["tokenAmount"]["amount"];
        if (balance == 1) {
            i += 1;
            mint = account.account.data["parsed"]["info"]["mint"];

            // POST mint to server if in merchant wallet (balance == 1)
            const item = {
                mint: mint,
                used: false,
                trx: null
            }
            const mintRoute = MINTS_ROUTE + '/' + mint.toString()

            await fetch(mintRoute, {
                method: 'POST',
                headers: {
                    'Content-Type':'application/json',
                    'Accept':'application/json'
                },
                body: JSON.stringify(item)
            })
        }
    });
    if (mint) {
        console.log(`Found ${i} token account(s) for wallet: ${walletString}`)
    }
    else {
        console.log(`No mints found for wallet: ${walletString}`)
        return null;
    }
};





