
import {PublicKey, Keypair, Message} from '@solana/web3.js'
import * as anchor from '@project-serum/anchor';
import nacl from 'tweetnacl'
import { decodeUTF8, encodeUTF8 } from "tweetnacl-util";
import {NextFunction, Request, Response} from "express"
import * as mints from "../controllers/mints"
import {Express} from 'express'
import * as express from 'express'
import app from '../server'
import * as config from '../config.json'
import { nextTick } from 'process';
const secret = config.MERCHANT_SECRET_KEY;

const verify = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<any> => {

  // get Keypair
  let feePayer: Keypair;
  feePayer = Keypair.fromSecretKey(
    Uint8Array.from(
      secret
    )
  );
  console.log('feePayer = ', feePayer.publicKey.toBase58())

  if (!feePayer) {
    console.log('Keypair to validate server does not exist!')
    res.status(400);
    res.send('Keypair to validate server does not exist!')
    return;
  }

  // create and sign offline trx to verify request
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const msg = 'arbitrary message to verify wallet'
  const encodedMsg = encoder.encode(msg)
  const secretBytes = Buffer.from(secret);
  const signature = nacl.sign.detached(encodedMsg, feePayer.secretKey)

  if (!signature) {
    console.log('Failed to sign!')
    res.status(400);
    res.send('Failed to sign!')
    return;   
  }

    console.log('signature: ', signature.toString())
    console.log('pubkey: ', feePayer.publicKey.toBase58())
  
    const encodedSig = Uint8Array.from(signature);
    
    if (signature) {
      const verify = nacl.sign.detached.verify(encodedMsg, encodedSig, feePayer.publicKey.toBytes())
      console.log('verify: ', verify)
  
      if (!verify) {
          res.status(400);
          res.send("Invalid signed message!")
          return;
      } 
      else {
        next();
      }
    } 
    else {
      res.status(400);
      res.send("Server validation signature not found!")
      return;
    }
}

export const MintRoutes = (app: Express) => {
  const router = express.Router();

  // Retrieve all unused Mints in database
  router.get("/valid", mints.validMints);

  // Retrieve all used Mints in database
  router.get("/burned", mints.burnedMints);

  // Retrieve all Mint instances in database
  router.get("/all", mints.allMints);

  // Create a new Mint (unused)
  router.post("/:mint", verify, mints.create);

  // Retrieve single Mint
  router.get("/:mint", mints.findByMint);

  // Update existing Mint (used)
  router.put("/:mint", verify, mints.update);

  // redirect all /mints routes to this file
  app.use('/mints', router);
}

export default MintRoutes;