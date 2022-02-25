
import {PublicKey} from '@solana/web3.js'
import nacl from 'tweetnacl'
import {NextFunction, Request, Response} from "express"
import * as mints from "../controllers/mints"
import {Express} from 'express'
import * as express from 'express'
import app from '../server'

// verify trx signature on backend before updating User
const verifyOwnerShip = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req) {
    return;
  } else {

    const pubkey = new PublicKey(req.params.wallet);
    const signature = req.body.signature;
    const signedMsg = req.body.message;
  
    const encoder = new TextEncoder()
    const parsedMessage = encoder.encode(signedMsg)
    //let parsedSignature = Uint8Array.from(JSON.parse(signature));
    const parsedSignature = Uint8Array.from(signature.signature.data);
  
    const verify = nacl.sign.detached.verify(parsedMessage, parsedSignature, pubkey.toBytes())
  
    console.log('verify = ', verify)
    if (!verify) {
        res.status(400);
        res.send("Invalid signed message!")
        return;
    }
  
    // continue to users.update
    next();
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
  router.post("/:mint", mints.create);

  // Retrieve single Mint
  router.get("/:mint", mints.findByMint);

  // Update existing Mint (used)
  router.put("/:mint", mints.update);

  // redirect all /mints routes to this file
  app.use('/mints', router);
}

export default MintRoutes;