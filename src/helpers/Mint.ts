
import { Keypair, PublicKey, SystemProgram, Connection } from '@solana/web3.js';
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    MintLayout,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { 
    TOKEN_METADATA_PROGRAM_ID,
} from '../utils/constants';
import { 
    getAssociatedTokenAddress,
    createTransferInstruction,
    createMintToInstruction,
    createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';


export const transferMint = async (
    connection: Connection,
    feePayer: Keypair,
    customer: PublicKey,
    mint: PublicKey
): Promise<string | null> => {

    const trx = new web3.Transaction();

    // get pubkey of ATA for current owner
    const fromATA = await getAssociatedTokenAddress(
        mint, // mint
        feePayer.publicKey // token account authority,
    ); 
    // get/create pubkey of ATA for customer to hold mint
    const toATA = await getAssociatedTokenAddress(
        mint, // mint
        customer // token account authority,
    ); 

    // Add token transfer instructions to transaction
    trx.add(
        // create token account
        createAssociatedTokenAccountInstruction(
            feePayer.publicKey,
            toATA,
            customer,
            mint,            
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        ),

        createTransferInstruction(
            fromATA,
            toATA,
            feePayer.publicKey,
            1,
        )
        /*
        // mint to token account
        createMintToInstruction(
            mint,
            toATA,
            feePayer.publicKey,
            1
        )
        */
    );

    return await connection.sendTransaction(trx, [feePayer])
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

export const readMerchantMints = async (
    connection: Connection,
    wallet: PublicKey,
): Promise<PublicKey | null> => {

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
    console.log(`Found ${accounts.length} token account(s) for wallet ${walletString}: `);
    accounts.forEach(async (
        account: any
    ) => {
        mint = new PublicKey(account.account.data["parsed"]["info"]["mint"]);
        //console.log('mint = ', mint.toBase58())
    });

    if (mint) {
        return mint;
    }
    else {
        return null;
    }
};





