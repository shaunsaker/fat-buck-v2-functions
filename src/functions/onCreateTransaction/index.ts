import * as functions from 'firebase-functions';
import {
  DepositTransactionData,
  TradeTransactionData,
  WithdrawalTransactionData,
  TransactionData,
  TransactionType,
} from '../../services/firebase/models';
import { processDeposit } from './processDeposit';
import { processTrade } from './processTrade';
import { processWithdrawal } from './processWithdrawal';

// TODO: before we actually set these amounts, we should run an audit to make sure all transactions are accounted for in the pool balance
export const onCreateTransaction = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() as TransactionData;
    const { transactionId } = context.params;

    if (data.type === TransactionType.DEPOSIT) {
      await processDeposit(transactionId, data as DepositTransactionData);
    }

    if (data.type === TransactionType.TRADE) {
      await processTrade(transactionId, data as TradeTransactionData);
    }

    if (data.type === TransactionType.WITHDRAWAL) {
      await processWithdrawal(data as WithdrawalTransactionData);
    }
  });
