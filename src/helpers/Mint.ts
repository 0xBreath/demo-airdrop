
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
    getOrCreateAssociatedTokenAccount
} from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';


export const transferMint = async (
    connection: Connection,
    feePayer: Keypair,
    customer: PublicKey,
    mint: PublicKey
): Promise<string | null> => {

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

    
    // Add token transfer instructions to transaction
    trx.add(
        createTransferInstruction(
            fromATA.address,
            toATA.address,
            feePayer.publicKey,
            1,
        )
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
    let balance;
    let i = 0;
    accounts.forEach(async (
        account: any
    ) => {
        balance = account.account.data["parsed"]["info"]["tokenAmount"]["amount"];
        console.log("balance = ", balance)
        if (balance == 1) {
            i += 1;
            mint = new PublicKey(account.account.data["parsed"]["info"]["mint"]);
        }
    });
    if (mint) {
        console.log(`Found ${i} token account(s) for wallet ${walletString}: `)
        return mint;
    }
    else {
        return null;
    }
};





