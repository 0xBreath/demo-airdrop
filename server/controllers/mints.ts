
import {PublicKey} from '@solana/web3.js';
import db from "../models";
const Mint = db.mints;

export const validMints = (req: any, res: any) => {
  // Get all unused mints
  Mint.findAll({
    where: {
      used: false
    }
  })
  .then((data: any) => {
    res.send(data);
  });
}

export const burnedMints = (req: any, res: any) => {
  // Get all used mints
  Mint.findAll({
    where: {
      used: true
    }
  })
  .then((data: any) => {
    res.send(data);
  });
}

export const allMints = async (req: any, res: any) => {
  // Find all mints in database
  const mints = await Mint.findAll()
  console.log(mints.every((mint: any) => mint instanceof Mint)); // true
  console.log("All mints:", JSON.stringify(mints, null, 2));
  return JSON.stringify(mints);
}

// Create and Save a new User
export const create = (req: any, res: any) => {

  console.log('CREATE')
    // Validate request
    if (!req.params.mint) {
        res.status(400).send({
          message: "Content can not be empty!"
        });
        return;
    }
    
    // Create a Mint
    const mint = {
        mint: req.body.mint,
        used: false,
        trx: null
    };
    
      // Save User in the database
    Mint.create(mint)
        .then((data: any) => {
          res.send(data);
        })
        .catch((err: any) => {
          res.status(500).send({
            message:
              err.message || "Error creating Mint."
          });
        });
};

export const update = async (req: any, res: any) => {

  console.log('UPDATE')

  // Validate request
  if (!req.params.mint || !req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  
  // Create a User
  const mint = req.params.mint;
  console.log('MINT = ', mint)
  console.log('TRX = ', req.body.trx)

  // return existing user
  const oldMint = await Mint.findOne({
    where: { mint: mint },
  });
  if (oldMint == null) {
    console.log('ERROR: oldMint not found in database')
  } else {
    console.log('oldMint found.')
  }

  // change user to signed=1 (verified)
  const updateMint = {
    mint: oldMint.mint,
    used: true,
    trx: req.body.trx
  }
  
  // update User in database
  Mint.update(updateMint, {
    where: { mint: mint }
  })
    .then((num: any) => {
      if (num == 1) {
        console.log(`Success: Mint (${mint}) was updated.`)
        res.send({
          message: `Success: Mint (${mint}) was updated.`
        });
        return true;
      } else {
        res.send({
          message: `Failed to update Mint (${mint}). Mint was not found or req.body is empty!`
        });
        return false;
      }
    })
    .catch((err: any) => {
      res.status(500).send({
        message: "Error updating Mint: " + mint
      });
      return false;
    });
    return false;
};

export const findByMint = async (req: any, res: any) => {

  const mint = req.params.mint;
  console.log('## MINT = ', mint)

  await Mint.findOne({
    where: { mint: mint },
  })
  .then((data: any) => {
    res.send(data);
  });
}

export default {validMints, burnedMints, allMints, create, update, findByMint};