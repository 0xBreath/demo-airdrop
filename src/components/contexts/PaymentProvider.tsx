import {
    createTransaction,
    encodeURL,
    findTransactionSignature,
    FindTransactionSignatureError,
    parseURL,
    validateTransactionSignature,
    ValidateTransactionSignatureError,
} from '@solana/pay';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
    ConfirmedSignatureInfo, 
    Keypair, 
    PublicKey, 
    TransactionSignature
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig } from '../../hooks/useConfig';

import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { PaymentContext, PaymentStatus } from '../../hooks/usePayment';
import { Confirmations } from '../../types';
import {
    USDC_TOKEN,
    MERCHANT_SECRET_KEY
} from '../../utils/constants'
import {readMerchantMints, transferMint} from '../../helpers/Mint'


export interface PaymentProviderProps {
    children: ReactNode;
} 

export const PaymentProvider: FC<PaymentProviderProps> = ({ children }) => {
    const { connection } = useConnection();
    let { 
        recipient, 
        label, 
        requiredConfirmations, 
        connectWallet 
    } = useConfig();
    const { publicKey, sendTransaction } = useWallet();

    /* added token, symbol states to Payment model */
    const [symbol, setSymbol] = useState<string | undefined>('SOL');
    const [splToken, setToken] = useState<PublicKey | undefined>();
    const [collection, setCollection] = useState<PublicKey | undefined>();
    const [mint, setMint] = useState<PublicKey>();
    const [customer, setCustomer] = useState<PublicKey>();
    const [keypair, setKeypair] = useState<Keypair>();

    const [amount, setAmount] = useState<BigNumber>();
    const [message, setMessage] = useState<string>();
    const [memo, setMemo] = useState<string>();
    const [reference, setReference] = useState<PublicKey>();
    const [signature, setSignature] = useState<TransactionSignature>();
    const [status, setStatus] = useState(PaymentStatus.New);
    const [confirmations, setConfirmations] = useState<Confirmations>(0);
    const navigate = useNavigateWithQuery();
    const progress = useMemo(() => confirmations / requiredConfirmations, [confirmations, requiredConfirmations]);

    const changeSymbol = useCallback(() => {
        if (symbol === 'SOL') {
            setSymbol('USDC');
        }
        if (symbol === 'USDC') {
            setSymbol('SOL')
        }
    }, [symbol]);

    const changeToken = useCallback(() => {
        if (splToken === undefined) {
            setToken(USDC_TOKEN);
        }
        if (splToken === USDC_TOKEN) {
            setToken(undefined)
        }
    }, [splToken, USDC_TOKEN]);

    const url = useMemo(
        () =>
            encodeURL({
                recipient,
                amount,
                splToken,
                reference,
                label,
                message,
                memo,
            }),
        [recipient, amount, splToken, reference, label, message, memo]
    );

    const reset = useCallback(() => {
        setKeypair(undefined);
        setMint(undefined);
        setCustomer(undefined);
        setCollection(undefined);
        setToken(undefined);
        setAmount(undefined);
        setMessage(undefined);
        setMemo(undefined);
        setReference(undefined);
        setSignature(undefined);
        setStatus(PaymentStatus.New);
        setConfirmations(0);
        navigate('/new', { replace: true });
    }, [navigate]);

    const generate = useCallback(() => {
        if (status === PaymentStatus.New && !reference) {
            setReference(Keypair.generate().publicKey);
            setStatus(PaymentStatus.Pending);
            navigate('/pending');
        }
    }, [status, reference, navigate]);

    // If there's a connected wallet, use it to sign and send the transaction
    useEffect(() => {
        if (status === PaymentStatus.Pending && connectWallet && publicKey) {
            let changed = false;

            const run = async () => {
                try {
                    const { recipient, amount, splToken, reference, memo } = parseURL(url);
                    if (!amount) return;

                    const transaction = await createTransaction(connection, publicKey, recipient, amount, {
                        splToken,
                        reference,
                        memo,
                    });

                    if (!changed) {
                        await sendTransaction(transaction, connection);
                    }

                } catch (error) {
                    // If the transaction is declined or fails, try again
                    console.error(error);
                    timeout = setTimeout(run, 5000);
                }
            };
            let timeout = setTimeout(run, 0);

            return () => {
                changed = true;
                clearTimeout(timeout);
            };
        }
    }, [status, connectWallet, publicKey, url, connection, sendTransaction, recipient]);

    // When the status is pending, poll for the transaction using the reference key
    useEffect(() => {
        if (!(status === PaymentStatus.Pending && reference && !signature)) return;
        let changed = false;

        const interval = setInterval(async () => {
            let signature: ConfirmedSignatureInfo;
            try {
                signature = await findTransactionSignature(connection, reference, undefined, 'confirmed');  


                if (!changed) {
                    clearInterval(interval);
                    setSignature(signature.signature);
                    setStatus(PaymentStatus.Confirmed);
                    //navigate('/confirmed', { replace: true });
                }

                // isolate customer's publickey from trx signature
                // setCustomer to customer's publicKey
                const trx = await connection.getParsedTransaction(signature.signature)
                let user;
                if (trx) {
                    user = trx.transaction.message.accountKeys[0].pubkey
                }
                if (user) {
                    console.log('customer = ', user.toBase58())
                    setCustomer(user)
                } 

                let feePayer: Keypair;
                const secretKey = MERCHANT_SECRET_KEY;
                if (secretKey) {
                    feePayer = Keypair.fromSecretKey(
                        Uint8Array.from(
                            secretKey
                        )
                    );
                    console.log('feePayer = ', feePayer)
                    setKeypair(feePayer)
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                // If the RPC node doesn't have the transaction signature yet, try again
                if (!(error instanceof FindTransactionSignatureError)) {
                    console.error(error);
                }
            }
        }, 250);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [status, publicKey, reference, signature, connection, navigate]);

    // When the status is confirmed, validate the transaction against the provided params
    // Then send an NFT from the merchant (recipient) to the customer (publicKey)
    useEffect(() => {
        if (!(status === PaymentStatus.Confirmed && signature && amount)) return;
        let changed = false;

        const run = async () => {
            try {
                await validateTransactionSignature(
                    connection,
                    signature,
                    recipient,
                    amount,
                    splToken,
                    reference,
                    'confirmed'
                );

                if (!changed) {
                    setStatus(PaymentStatus.Valid);
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                // If the RPC node doesn't have the transaction yet, try again
                if (
                    error instanceof ValidateTransactionSignatureError &&
                    (error.message === 'not found' || error.message === 'missing meta')
                ) {
                    console.warn(error);
                    timeout = setTimeout(run, 250);
                    return;
                }

                console.error(error);
                setStatus(PaymentStatus.Invalid);
            }
        };
        let timeout = setTimeout(run, 0);

        return () => {
            changed = true;
            clearTimeout(timeout);
        };
    }, [status, signature, MERCHANT_SECRET_KEY, amount, customer, connection, recipient, splToken, reference]);

    // When the status is valid, poll for confirmations until the transaction is finalized
    useEffect(() => {
        if (!(status === PaymentStatus.Valid && signature)) return;
        let changed = false;

        const interval = setInterval(async () => {
            try {
                const response = await connection.getSignatureStatus(signature);
                const status = response.value;
                if (!status) return;
                if (status.err) throw status.err;

                if (!changed) {
                    setConfirmations((status.confirmations || 0) as Confirmations);

                    if (status.confirmationStatus === 'finalized') {
                        clearInterval(interval);
                        setStatus(PaymentStatus.Finalized);

                        // read merchant/recipient wallet to find NFT to send to customer
                        // setMint to NFT publicKey
                        const mint = await readMerchantMints(connection, recipient)
                        if (mint) {
                            setMint(mint)
                            console.log('mint => ', mint.toBase58())
                        }

                        /* 
                        if NFT mint and customer publicKey exists
                        send NFT to customer from merchant/recipient 
                        */
                        console.log(
                            `mint: ${mint?.toBase58()} `+
                            `customer: ${customer?.toBase58()} `+
                            `keypair: ${keypair}`
                        )
                        if (mint && customer && keypair) {

                            const transferTrx = await transferMint(
                                connection,
                                keypair,
                                customer,
                                mint
                            )
                            console.log('transferTrx = ', transferTrx)
                        }
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.log(error);
            }
        }, 250);

        return () => {
            changed = true;
            clearInterval(interval);
        };
    }, [status, signature, connection, customer, mint, keypair]); 


    return (
        <PaymentContext.Provider
            value={{
                keypair,
                setKeypair,
                mint,
                setMint,
                customer,
                setCustomer,
                collection,
                setCollection,
                splToken,
                symbol,
                amount,
                setAmount,
                message,
                setMessage,
                memo,
                setMemo,
                reference,
                signature,
                status,
                confirmations,
                progress,
                url,
                reset,
                generate,
                changeToken,
                changeSymbol
            }}
        >
            {children}
        </PaymentContext.Provider>
    );
};
