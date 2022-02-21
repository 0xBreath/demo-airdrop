import * as anchor from "@project-serum/anchor";
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import { 
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM_ID,
    TOKEN_PROGRAM_ID
} from '../../utils/constants';
import {Metadata} from '@metaplex-foundation/mpl-token-metadata'

export const awaitTransactionSignatureConfirmation = async (
  txid: anchor.web3.TransactionSignature,
  timeout: number,
  connection: anchor.web3.Connection,
  commitment: anchor.web3.Commitment = "recent",
  queryStatus = false
): Promise<anchor.web3.SignatureStatus | null | void> => {
  let done = false;
  let status: anchor.web3.SignatureStatus | null | void = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  status = await new Promise(async (resolve, reject) => {
    setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      console.log("Rejecting for timeout...");
      reject({ timeout: true });
    }, timeout);
    try {
      subId = connection.onSignature(
        txid,
        (result: any, context: any) => {
          done = true;
          status = {
            err: result.err,
            slot: context.slot,
            confirmations: 0,
          };
          if (result.err) {
            console.log("Rejected via websocket", result.err);
            reject(status);
          } else {
            console.log("Resolved via websocket", result);
            resolve(status);
          }
        },
        commitment
      );
    } catch (e) {
      done = true;
      console.error("WS error in setup", txid, e);
    }
    while (!done && queryStatus) {
      // eslint-disable-next-line no-loop-func
      (async () => {
        try {
          const signatureStatuses = await connection.getSignatureStatuses([
            txid,
          ]);
          status = signatureStatuses && signatureStatuses.value[0];
          if (!done) {
            if (!status) {
              console.log("REST null result for", txid, status);
            } else if (status.err) {
              console.log("REST error for", txid, status);
              done = true;
              reject(status.err);
            } else if (!status.confirmations) {
              console.log("REST no confirmations for", txid, status);
            } else {
              console.log("REST confirmation for", txid, status);
              done = true;
              resolve(status);
            }
          }
        } catch (e) {
          if (!done) {
            console.log("REST connection error: txid", txid, e);
          }
        }
      })();
      await sleep(2000);
    }
  });

  //@ts-ignore
  if (connection._signatureSubscriptions[subId]) {
    connection.removeSignatureListener(subId);
  }
  done = true;
  console.log("Returning status", status);
  return status;
};

export const getTokenWallet = async (
  wallet: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey
) => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    )
  )[0];
};

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export const filterCollection = async (
  connection: Connection,
  mint: PublicKey,
  updateAuth: PublicKey,
  creator: PublicKey
) => {
  const pda = await Metadata.getPDA(mint);
  const content = await Metadata.load(connection, pda);

  const mintUpdateAuth = new PublicKey(content.data.updateAuthority);
  const mintUri = content.data.data.uri
  const mintMetadata = await(await fetch(mintUri, {method: "Get"})).json()
  const mintCreator = new PublicKey((mintMetadata.properties.creators[0].address))

  if (updateAuth === mintUpdateAuth && creator === mintCreator) {
    return true;
  }
  return false;
}

export const extractData = async (
  connection: Connection,
  mint: PublicKey
) => {
  const pda = await Metadata.getPDA(mint);
  const content = await Metadata.load(connection, pda);

  const updateAuth = new PublicKey(content.data.updateAuthority);
  const uri = content.data.data.uri
  const metadata = await(await fetch(uri, {method: "Get"})).json()
  const creator = new PublicKey((metadata.properties.creators[0].address))

  return [updateAuth, creator]

}

export const bouncer = async (
    connection: Connection,
    wallet: PublicKey,
    validMint: PublicKey
) => {

    const [updateAuth, creator] = await extractData(connection, validMint);
    console.log('updateAuth = ', updateAuth)
    console.log('creator. =', creator)

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

    console.log(`Found ${accounts.length} token account(s) for wallet ${walletString}: `);
    accounts.forEach(async (
        account: any
    ) => {
        const mint = account.account.data["parsed"]["info"]["mint"];
        const valid = await filterCollection(connection, mint, updateAuth, creator)
        if (valid) {
          return valid;
        }
    });
    return false;
};