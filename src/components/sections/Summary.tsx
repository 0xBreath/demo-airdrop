import React, { FC } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { usePayment } from '../../hooks/usePayment';
import { Amount } from './Amount';
import * as css from './Summary.module.pcss';

export const Summary: FC = () => {
    const { symbol } = usePayment();
    const { amount } = usePayment();

    return (
        <div className={css.root}>
            <div className={css.total}>
                <div className={css.totalLeft}></div>
                <div className={css.totalRight}>
                    <div className={css.symbol}>{symbol}</div>
                    <div className={css.amount}>
                        <Amount amount={amount} />
                    </div>
                </div>
            </div>
        </div>
    );
};
