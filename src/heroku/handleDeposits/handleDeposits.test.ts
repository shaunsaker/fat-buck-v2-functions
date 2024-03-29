import { processDeposits } from '../handleDeposits';
import {
  BinanceDepositList,
  BinanceDepositStatus,
} from '../../services/binance/models';
import {
  DepositCallData,
  DepositStatus,
  DepositTransactionData,
  MessagingTopics,
  TransactionType,
} from '../../services/firebase/models';
import { getDate } from '../../utils/getDate';
import { getUniqueId } from '../../utils/getUniqueId';
import { randomise } from '../../utils/randomise';
import { makeBinanceDeposit } from '../../testUtils/makeBinanceDeposit';
import { makeDepositCall } from '../../testUtils/makeDepositCall';

describe('handleDeposits', () => {
  const onSaveTransaction = jest.fn();
  const onSaveDepositCall = jest.fn();
  const onSendNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works when deposit history and deposit calls are empty', async () => {
    const depositHistory: BinanceDepositList = [];
    const depositCalls: DepositCallData[] = [];
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn();

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onGetTxInputWalletAddress).not.toHaveBeenCalled();
    expect(onSaveTransaction).not.toHaveBeenCalled();
    expect(onSaveDepositCall).not.toHaveBeenCalled();
    expect(onSendNotification).not.toHaveBeenCalled();
  });

  it('works when deposit history is empty but there are deposit calls', async () => {
    const depositHistory: BinanceDepositList = [];
    const depositCalls: DepositCallData[] = [
      makeDepositCall(),
      makeDepositCall(),
      makeDepositCall(),
    ];
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn();

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onGetTxInputWalletAddress).not.toHaveBeenCalled();
    expect(onSaveTransaction).not.toHaveBeenCalled();
    expect(onSaveDepositCall).not.toHaveBeenCalled();
    expect(onSendNotification).not.toHaveBeenCalled();
  });

  it('works with a matching pending deposit', async () => {
    const walletAddress = getUniqueId();
    const transactionId = getUniqueId();
    const depositHistory: BinanceDepositList = randomise([
      makeBinanceDeposit(walletAddress, transactionId),
    ]);
    const depositCall = makeDepositCall(walletAddress);
    const depositCalls: DepositCallData[] = randomise([depositCall]);
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn(
      () => new Promise<string>((resolve) => resolve(walletAddress)),
    );

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    const expectedDepositCall: DepositCallData = {
      ...depositCall,
      txId: transactionId,
    };

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onGetTxInputWalletAddress).toHaveBeenCalledWith(transactionId);
    expect(onSaveTransaction).not.toHaveBeenCalled();
    expect(onSaveDepositCall).toHaveBeenCalledWith(
      expectedDepositCall,
      expectedDepositCall.id,
    );
    expect(onSendNotification).not.toHaveBeenCalled();
  });

  it('works with multiple matching pending deposits', async () => {
    const walletAddress1 = getUniqueId();
    const transactionId1 = getUniqueId();
    const walletAddress2 = getUniqueId();
    const transactionId2 = getUniqueId();
    const depositHistory: BinanceDepositList = randomise([
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(walletAddress1, transactionId1),
      makeBinanceDeposit(walletAddress2, transactionId2),
    ]);
    const depositCall1 = makeDepositCall(walletAddress1);
    const depositCall2 = makeDepositCall(walletAddress2);
    const depositCalls: DepositCallData[] = randomise([
      makeDepositCall(),
      makeDepositCall(),
      makeDepositCall(),
      depositCall1,
      depositCall2,
    ]);
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn(
      () => new Promise<string>((resolve) => resolve(walletAddress1)),
    );

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onGetTxInputWalletAddress).toHaveBeenCalledWith(transactionId1);
    expect(onGetTxInputWalletAddress).toHaveBeenCalledWith(transactionId2);
    expect(onSaveTransaction).not.toHaveBeenCalled();
    expect(onSaveDepositCall).toHaveBeenCalledTimes(5);
    expect(onSendNotification).not.toHaveBeenCalled();
  });

  it('works with a matching verifying deposit', async () => {
    const walletAddress = getUniqueId();
    const transactionId = getUniqueId();
    const depositHistory: BinanceDepositList = randomise([
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(
        walletAddress,
        transactionId,
        BinanceDepositStatus.VERIFYING,
      ),
    ]);
    const depositCall = makeDepositCall(walletAddress);
    const depositCalls: DepositCallData[] = [
      makeDepositCall(),
      makeDepositCall(),
      makeDepositCall(),
      depositCall,
    ];
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn(
      () => new Promise<string>((resolve) => resolve(walletAddress)),
    );

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });
    const expectedDeposit: DepositCallData = {
      ...depositCall,
      txId: transactionId,
    };

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onGetTxInputWalletAddress).toHaveBeenCalledWith(transactionId);
    expect(onSaveTransaction).not.toHaveBeenCalled();
    expect(onSaveDepositCall).toHaveBeenCalledWith(
      expectedDeposit,
      expectedDeposit.id,
    );
    expect(onSendNotification).not.toHaveBeenCalled();
  });

  it('works with a matching success deposit', async () => {
    const walletAddress = getUniqueId();
    const transactionId = getUniqueId();
    const deposit = makeBinanceDeposit(
      walletAddress,
      transactionId,
      BinanceDepositStatus.SUCCESS,
    );
    const depositHistory: BinanceDepositList = randomise([
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      deposit,
    ]);
    const depositCall = makeDepositCall(walletAddress, transactionId);
    const depositCalls: DepositCallData[] = [
      makeDepositCall(),
      makeDepositCall(),
      makeDepositCall(),
      depositCall,
    ];
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn(
      () => new Promise<string>((resolve) => resolve(walletAddress)),
    );

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    const date = getDate();
    const expectedTransaction: DepositTransactionData = {
      uid: depositCall.uid,
      walletAddress: depositCall.walletAddress,
      depositCallId: depositCall.id,
      txId: transactionId,
      date,
      amount: deposit.amount,
      type: TransactionType.DEPOSIT,
    };
    const expectedDeposit: DepositCallData = {
      ...depositCall,
      status: DepositStatus.SUCCESS,
      resolvedDate: date,
    };

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onGetTxInputWalletAddress).toHaveBeenCalledWith(transactionId);
    expect(onSaveTransaction).toHaveBeenCalledWith(expectedTransaction);
    expect(onSaveDepositCall).toHaveBeenCalledWith(
      expectedDeposit,
      expectedDeposit.id,
    );
    expect(onSendNotification).toHaveBeenCalledWith({
      topic: MessagingTopics.depositSuccess,
      data: expectedTransaction,
    });
  });

  it('works with multiple matching success deposits', async () => {
    const walletAddress1 = getUniqueId();
    const transactionId1 = getUniqueId();
    const walletAddress2 = getUniqueId();
    const transactionId2 = getUniqueId();
    const depositHistory: BinanceDepositList = randomise([
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(
        walletAddress1,
        transactionId1,
        BinanceDepositStatus.SUCCESS,
      ),
      makeBinanceDeposit(
        walletAddress2,
        transactionId2,
        BinanceDepositStatus.SUCCESS,
      ),
    ]);
    const depositCall1 = makeDepositCall(walletAddress1, transactionId1);
    const depositCall2 = makeDepositCall(walletAddress2, transactionId2);
    const depositCalls: DepositCallData[] = randomise([
      makeDepositCall(),
      makeDepositCall(),
      makeDepositCall(),
      depositCall1,
      depositCall2,
    ]);
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn(
      () => new Promise<string>((resolve) => resolve(walletAddress1)),
    );

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onSaveTransaction).toHaveBeenCalledTimes(2);
    expect(onSaveDepositCall).toHaveBeenCalledTimes(5);
    expect(onSendNotification).toHaveBeenCalledTimes(2);
  });

  it('works with already matched successful deposits', async () => {
    const walletAddress = getUniqueId();
    const transactionId = getUniqueId();
    const deposit = makeBinanceDeposit(
      walletAddress,
      transactionId,
      BinanceDepositStatus.SUCCESS,
    );
    const depositHistory: BinanceDepositList = randomise([
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      deposit,
    ]);
    const depositCall = makeDepositCall(walletAddress, transactionId, true);
    const depositCalls: DepositCallData[] = randomise([
      makeDepositCall(),
      makeDepositCall(),
      makeDepositCall(),
      depositCall,
    ]);
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn(
      () => new Promise<string>((resolve) => resolve(walletAddress)),
    );

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onSaveTransaction).not.toBeCalled();
    expect(onSaveDepositCall).not.toBeCalled();
    expect(onSendNotification).not.toBeCalled();
  });

  it('works with deposits without matching deposit calls', async () => {
    const walletAddress = getUniqueId();
    const transactionId = getUniqueId();
    const deposit = makeBinanceDeposit(
      walletAddress,
      transactionId,
      BinanceDepositStatus.SUCCESS,
    );
    const depositHistory: BinanceDepositList = randomise([
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      deposit,
    ]);
    const depositCalls: DepositCallData[] = [];
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn(
      () => new Promise<string>((resolve) => resolve(walletAddress)),
    );

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onSaveTransaction).not.toBeCalled();
    expect(onSaveDepositCall).not.toBeCalled();
    expect(onSendNotification).not.toBeCalled();
  });

  it('works with non-matching wallet address', async () => {
    const walletAddress = getUniqueId();
    const transactionId = getUniqueId();
    const deposit = makeBinanceDeposit(
      walletAddress,
      transactionId,
      BinanceDepositStatus.SUCCESS,
    );
    const depositHistory: BinanceDepositList = randomise([
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      deposit,
    ]);
    const anotherWalletAddress = getUniqueId();
    const depositCall = makeDepositCall(anotherWalletAddress);
    const depositCalls: DepositCallData[] = randomise([
      makeDepositCall(),
      makeDepositCall(),
      makeDepositCall(),
      depositCall,
    ]);
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn(
      () => new Promise<string>((resolve) => resolve(walletAddress)),
    );

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onSaveTransaction).not.toBeCalled();
    expect(onSaveDepositCall).not.toBeCalled();
    expect(onSendNotification).not.toBeCalled();
  });

  it('handles non-BTC deposits', async () => {
    const walletAddress = getUniqueId();
    const transactionId = getUniqueId();
    const notBTC = 'IOTA';
    const deposit = makeBinanceDeposit(
      walletAddress,
      transactionId,
      BinanceDepositStatus.SUCCESS,
      notBTC,
    );
    const depositHistory: BinanceDepositList = randomise([
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      makeBinanceDeposit(getUniqueId(), getUniqueId()),
      deposit,
    ]);
    const depositCall = makeDepositCall(walletAddress, transactionId);
    const depositCalls: DepositCallData[] = randomise([
      makeDepositCall(),
      makeDepositCall(),
      makeDepositCall(),
      depositCall,
    ]);
    const onGetDepositHistory = jest.fn(
      () =>
        new Promise<BinanceDepositList>((resolve) => resolve(depositHistory)),
    );
    const onGetDepositCalls = jest.fn(
      () => new Promise<DepositCallData[]>((resolve) => resolve(depositCalls)),
    );
    const onGetTxInputWalletAddress = jest.fn(
      () => new Promise<string>((resolve) => resolve(walletAddress)),
    );

    await processDeposits({
      onGetDepositHistory,
      onGetDepositCalls,
      onGetTxInputWalletAddress,
      onSaveTransaction,
      onSaveDepositCall,
      onSendNotification,
    });

    const expectedDeposit: DepositCallData = {
      ...depositCall,
      status: DepositStatus.ERROR,
      message: `We do not support ${notBTC} deposits. Your deposit will be returned to your wallet address, ${walletAddress}.`,
      txId: transactionId,
    };

    expect(onGetDepositHistory).toHaveBeenCalled();
    expect(onGetDepositCalls).toHaveBeenCalled();
    expect(onSaveTransaction).not.toBeCalled();
    expect(onSaveDepositCall).toHaveBeenCalledWith(
      expectedDeposit,
      expectedDeposit.id,
    );
    expect(onSendNotification).not.toBeCalled();
  });
});
