export interface CallResponse {
  success?: boolean;
  error?: boolean;
  message?: string;
}

export interface DepositCallArgs {
  walletAddress: string;
}

export interface WithdrawalCallArgs {
  walletAddress: string;
  amount: number;
}

export enum DepositStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface DepositCallData {
  id?: string;
  uid: string;
  date: string;
  walletAddress: string;
  status: DepositStatus;
  txId?: string; // added once it has been seen in deposit history
  resolvedDate?: string; // added once it has resolved (status is SUCCESS)
  message?: string; // used for errors
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  EMAIL_SENT = 'EMAIL_SENT',
  CANCELLED = 'CANCELLED',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  FAILURE = 'FAILURE',
  COMPLETED = 'COMPLETED',
}

export interface WithdrawalCallData {
  id?: string;
  uid: string;
  date: string;
  walletAddress: string;
  amount: number;
  status: WithdrawalStatus;
  txId?: string; // added once it has been seen in withdrawal history
  resolvedDate?: string; // added once it has resolved (status is COMPLETED)
  message?: string; // used for errors
}

export const NO_UID_ERROR_MESSAGE = 'You shall not pass.';
export const NO_WALLET_ADDRESS_ERROR_MESSAGE =
  'You did not provide a wallet address.';
export const INSUFFICIENT_FUNDS_ERROR_MESSAGE =
  'You have requested to withdraw more BTC than is in your account.';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  COMMISSION = 'COMMISSION',
  TRADE = 'TRADE',
}

export interface BaseTransactionData {
  date: string;
  amount: number;
  type: TransactionType;
}

export interface DepositTransactionData extends BaseTransactionData {
  uid: string;
  walletAddress: string;
  depositCallId: string;
  txId: string;
}

export interface CommissionTransactionData extends BaseTransactionData {
  depositId: string;
  uid: string; // used to filter a users own transactions
}

export interface TradeTransactionData extends BaseTransactionData {
  tradeId: string;
  profitRatio: number;
}

export interface UserTradeTransactionData extends TradeTransactionData {
  transactionId: string;
}

export interface WithdrawalTransactionData extends BaseTransactionData {
  uid: string;
  walletAddress: string;
  withdrawalCallId: string;
  txId: string;
  transactionFee: number;
  resolvedAmount: number;
}

export type TransactionData =
  | DepositTransactionData
  | CommissionTransactionData
  | TradeTransactionData
  | WithdrawalTransactionData;

export interface PoolBalanceData {
  amount: number;
  value: number;
  lastUpdated: string;
}

export interface UserData {
  balance: number;
  balanceLastUpdated: string;
  id: string;
  isAdmin?: boolean;
}

export interface PoolCommissionData {
  amount: number;
  lastUpdated: string;
}

export interface PoolProfitData {
  ratio: number;
  amount: number;
  lastUpdated: string;
}

export interface BotData {
  id?: string;
  api: string;
  dateUpdated: string;
  isActive: boolean;
  isAlive: boolean;
}

export enum MessagingTopics {
  openedTrades = 'openedTrades',
  closedTrades = 'closedTrades',
  depositSuccess = 'depositSuccess',
}

export interface Message {
  title: string;
  body: string;
}
