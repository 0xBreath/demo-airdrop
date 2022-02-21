import React, { FC } from 'react';
import { usePayment } from '../../hooks/usePayment';
import * as css from './Token.module.pcss';

export const Token: FC = () => {

    const {changeToken, changeSymbol, symbol} = usePayment();

    const toggle = () => {
        changeToken();
        changeSymbol();
    }

    return (
        <div className={css.root}>
            <div className={css.total}>
                <div className={css.totalLeft}></div>
                <div className={css.totalRight}></div>
                <div className={css.row}>
                    <button
                        className={css.option}
                        onClick={toggle}
                    >
                        {symbol}
                    </button>            
                </div>
            </div>
        </div>
    );
};

/*
                <div className={css.row}>
                    <GenerateButton/>
                    <TransactionsLink/>
                </div>
*/


