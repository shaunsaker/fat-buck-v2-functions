import { getUserBalance } from '../../services/firebase/getUserBalance';
import {
  UserData,
  WithdrawalTransactionData,
} from '../../services/firebase/models';
import { saveUserData } from '../../services/firebase/saveUserData';
import { getDate } from '../../utils/getDate';

export const handleUpdateUserBalance = async ({
  data,
  onGetUserBalance,
  onSaveUserData,
}: {
  data: WithdrawalTransactionData;
  onGetUserBalance: typeof getUserBalance;
  onSaveUserData: typeof saveUserData;
}): Promise<null> => {
  // get the current user balance
  const { uid } = data;
  const userBalance = await onGetUserBalance(uid);

  // subtract the withdrawal amount from the user balance
  // CFO: we don't include the transaction fee and resolved amount, should we save two transactions to include these instead?
  const newUserBalance = userBalance - data.amount;

  // save the updated user balance
  const userData: UserData = {
    balance: newUserBalance,
    balanceLastUpdated: getDate(),
    id: uid,
  };
  await onSaveUserData(uid, userData);

  return null;
};

export const handleWithdrawal = async ({
  data,
  onUpdateUserBalance,
}: {
  data: WithdrawalTransactionData;
  onUpdateUserBalance: typeof handleUpdateUserBalance;
}): Promise<null> => {
  // update the user balance
  await onUpdateUserBalance({
    data,
    onGetUserBalance: getUserBalance,
    onSaveUserData: saveUserData,
  });

  return null;
};

export const processWithdrawal = async (
  data: WithdrawalTransactionData,
): Promise<null> => {
  await handleWithdrawal({
    data,
    onUpdateUserBalance: handleUpdateUserBalance,
  });

  return null;
};
