import {DataTypes} from 'sequelize'

export const Mint = (sequelize: any) => {
    const Mint = sequelize.define('mint', {
            mint: {
                type: DataTypes.STRING,
            },
            used: {
                type: DataTypes.BOOLEAN,
            },
            trx: {
                type: DataTypes.STRING,
            }         
        }
    )
    return Mint
}