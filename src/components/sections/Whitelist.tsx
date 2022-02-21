import React, { FC } from 'react';
import { usePayment } from '../../hooks/usePayment';
import * as css from './Whitelist.module.pcss';

export const Whitelist: FC = () => {
    const { collection } = usePayment();

    const onClick = async (val = '') => {
        //setCollection;
    }

    return (
        <div className={css.root}>
            <form>
                <div className={css.label} >
                    <input 
                        type="text" 
                        className={css.root} 
                        placeholder="Enter wallet address within collection"
                    >
                    
                    </input>
                </div>
            </form>
        </div>
    )
};
