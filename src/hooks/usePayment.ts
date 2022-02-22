import { Keypair, PublicKey, TransactionSignature } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { createContext, useContext } from 'react';
import { Confirmations } from '../types';

export enum PaymentStatus {
    New = 'New',
    Pending = 'Pending',
    Confirmed = 'Confirmed',
    Valid = 'Valid',
    Invalid = 'Invalid',
    Finalized = 'Finalized',
}

export interface PaymentContextState {
    keypair: Keypair | undefined;
    setKeypair(keypair: Keypair | undefined): void;
    mint: PublicKey | undefined;
    setMint(mint: PublicKey | undefined): void;
    customer: PublicKey | undefined;
    setCustomer(customer: PublicKey | undefined): void;
    collection: PublicKey | undefined;
    setCollection(collection: PublicKey | undefined): void;
    splToken: PublicKey | undefined;
    symbol: string | undefined;
    amount: BigNumber | undefined;
    setAmount(amount: BigNumber | undefined): void;
    message: string | undefined;
    setMessage(message: string | undefined): void;
    memo: string | undefined;
    setMemo(memo: string | undefined): void;
    reference: PublicKey | undefined;
    signature: TransactionSignature | undefined;
    status: PaymentStatus;
    confirmations: Confirmations;
    progress: number;
    url: string;
    reset(): void;
    generate(): void;
    changeToken(): void; // add arbitrary numbers of SPL token options
    changeSymbol(): void; // change token symbol depending on ^^
}

export const PaymentContext = createContext<PaymentContextState>({} as PaymentContextState);

export function usePayment(): PaymentContextState {
    return useContext(PaymentContext);
}
