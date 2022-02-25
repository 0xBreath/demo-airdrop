// server dependencies
import express from 'express'
import logger from 'morgan'
import db from './models'
import cors from 'cors'
//import * as users from './routes/users'

// discord dependencies
import {web3} from "@project-serum/anchor"
import fetch from "node-fetch"
import * as config from './config.json'
const port = config.postgres.port


/* ====================== EXPRESS ============================ */

// configure express
const app = express();
app.use(express.json())
app.use(cors())
app.options('/users', cors)
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev')); // log within console

// handle all default routes
app.get('/', (req: any, res: any) => {
    res.status(200).send({
        message: `Welcome to http://localhost:${port}`,
    })
})

// sync all models with database
db.sequelize.sync({ force: true }).then(() => {
    console.log("# Drop and re-sync database");
});

import MintRoutes from './routes/mints'
import { PublicKey } from '@solana/web3.js'
MintRoutes(app);
app.listen(port, () =>
    console.log(`Server listening at http://localhost:${port}`)
);

export default app;