import React, { FC } from 'react';
import { useMediaQuery } from 'react-responsive';
import { FullscreenButton } from '../buttons/FullscreenButton';
import { GenerateButton } from '../buttons/GenerateButton';
import { Token } from '../sections/Token'
import { TransactionsLink } from '../buttons/TransactionsLink';
import { NumPad } from '../sections/NumPad';
import { PoweredBy } from '../sections/PoweredBy';
import { Summary } from '../sections/Summary';
import {Whitelist} from '../sections/Whitelist'
import * as css from './NewRoute.module.pcss';

export const NewRoute: FC = () => {
    const phone = useMediaQuery({ query: '(max-width: 767px)' });

    return phone ? (
        <div className={css.root}>
            <div className={css.top}>
                <FullscreenButton />
            </div>
            <div className={css.body}>
                <NumPad />
            </div>
            <PoweredBy />
        </div>
    ) : (
        <div className={css.root}>
            <div className={css.main}>
                <div className={css.top}>
                    <FullscreenButton />
                </div>
                <div className={css.body}>
                    <NumPad />
                </div>
                <PoweredBy />
            </div>
            <div className={css.side}>
                <div className={css.summary}>
                    <TransactionsLink/>
                    <Token/>
                    <Whitelist/>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    <Summary />
                    <GenerateButton/>
                </div>
            </div>
        </div>
    );
};