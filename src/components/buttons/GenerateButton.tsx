import React, { FC } from 'react';
import { usePayment } from '../../hooks/usePayment';
import * as css from './GenerateButton.module.pcss';

export const GenerateButton: FC = () => {
    const { amount, generate } = usePayment();

    const onClick = () => {
        generate();
    }

    return (
        <button
            className={css.root}
            type="button"
            onClick={onClick}
            disabled={!amount || amount.isLessThanOrEqualTo(0)}
        >
            //
        </button>
    );
};



