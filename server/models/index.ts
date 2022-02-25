import {Sequelize} from "sequelize"
import * as config from '../config.json'

// configure database
const port = config.postgres.port
const user = config.postgres.user
const password = config.postgres.password
const host = config.postgres.host
const database = config.postgres.database


// database instance
const DB_URL = 'postgres://'+user+':'+password+'@'+host+'/'+database;
const sequelize = new Sequelize(DB_URL, {
    logQueryParameters: true,
})

import {Mint} from "./mints"
const mints = Mint(sequelize)

const db = {
    Sequelize: Sequelize,
    sequelize: sequelize,
    mints: mints
}

export default db;

