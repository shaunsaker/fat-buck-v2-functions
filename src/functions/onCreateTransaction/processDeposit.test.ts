import { getUniqueId } from '../../utils/getUniqueId';
import { deductCommission } from './deductCommission';
import {
  CommissionTransactionData,
  DepositTransactionData,
  PoolCommissionData,
  TransactionType,
  UserData,
} from '../../services/firebase/models';
import { handleDeposit } from './processDeposit';
import { MOCKED_MOMENT_ISO_STRING } from '../../../__mocks__/moment';

describe('processDeposit', () => {
  it('works correctly', async () => {
    const depositAmount = 0.5010101;
    const data: DepositTransactionData = {
      type: TransactionType.DEPOSIT,
      uid: getUniqueId(),
      walletAddress: getUniqueId(),
      depositCallId: getUniqueId(),
      binanceTransactionId: getUniqueId(),
      date: '',
      amount: depositAmount,
    };
    const transactionId = getUniqueId();
    const currentUserBalance = 0;
    const currentPoolCommission = 0;
    const onSaveCommissionTransaction = jest.fn();
    const onSaveUserCommissionTransaction = jest.fn();
    const onSaveUserDepositTransaction = jest.fn();
    const onUpdateUserBalance = jest.fn();
    const onUpdatePoolCommission = jest.fn();

    await handleDeposit({
      data,
      transactionId,
      currentUserBalance,
      currentPoolCommission,
      onSaveCommissionTransaction,
      onSaveUserCommissionTransaction,
      onSaveUserDepositTransaction,
      onUpdateUserBalance,
      onUpdatePoolCommission,
    });

    const { commission, newAmount } = deductCommission(depositAmount);
    const date = MOCKED_MOMENT_ISO_STRING;
    const expectedCommissionData: CommissionTransactionData = {
      date,
      amount: commission,
      type: TransactionType.COMMISSION,
      depositId: transactionId,
      uid: data.uid,
    };

    const expectedUserData: UserData = {
      balance: currentUserBalance + newAmount,
      balanceLastUpdated: date,
    };

    const expectedPoolCommissionData: PoolCommissionData = {
      amount: currentPoolCommission + commission,
      lastUpdated: date,
    };

    expect(onSaveCommissionTransaction).toHaveBeenCalledWith(
      expectedCommissionData,
    );
    expect(onSaveUserCommissionTransaction).toHaveBeenCalledWith(
      data.uid,
      expectedCommissionData,
    );
    expect(onSaveUserDepositTransaction).toHaveBeenCalledWith(data.uid, data);
    expect(onUpdateUserBalance).toHaveBeenCalledWith(
      data.uid,
      expectedUserData,
    );
    expect(onUpdatePoolCommission).toHaveBeenCalledWith(
      expectedPoolCommissionData,
    );
  });
});
