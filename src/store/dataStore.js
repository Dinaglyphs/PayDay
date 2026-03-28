// Default template data
export const DEFAULT_BILLS = [
  { id: '1', name: 'Klarna', budgeted: 199.00, category: 'Debt repayment' },
  { id: '2', name: 'Lendable', budgeted: 203.00, category: 'Debt repayment' },
  { id: '3', name: 'Rent', budgeted: 1496.40, category: 'Housing' },
  { id: '4', name: 'Train/fuel', budgeted: 100.00, category: 'Transport' },
  { id: '5', name: 'Food/Phone/Broadband', budgeted: 90.00, category: 'Food & living' },
  { id: '6', name: 'Aqua', budgeted: 38.00, category: 'Debt repayment' },
  { id: '7', name: 'Water & Electricity', budgeted: 104.00, category: 'Utilities' },
  { id: '8', name: 'Regina refund', budgeted: 100.00, category: 'Personal' },
  { id: '9', name: 'CIM & Gym', budgeted: 20.00, category: 'Personal' },
  { id: '10', name: 'Council Tax', budgeted: 398.21, category: 'Housing' },
  { id: '11', name: 'Ajo', budgeted: 200.00, category: 'Savings' },
  { id: '12', name: 'PPay', budgeted: 56.00, category: 'Other' },
  { id: '13', name: 'Lemfi', budgeted: 100.00, category: 'Debt repayment' },
]

export const DEFAULT_DEBTS = [
  { id: 'd1', name: 'Capital One', type: 'Credit card', startingBalance: 779.00 },
  { id: 'd2', name: 'Klarna', type: 'Credit card', startingBalance: 496.77 },
  { id: 'd3', name: 'Aqua', type: 'Credit card', startingBalance: 436.46 },
  { id: 'd4', name: 'Lendable', type: 'Loan', startingBalance: 0.00 },
  { id: 'd5', name: 'Lemfi', type: 'Credit card', startingBalance: 1400.00 },
  { id: 'd6', name: 'Wife', type: 'Personal', startingBalance: 634.00 },
]

export async function loadData() {
  if (window.paydayAPI) {
    const data = await window.paydayAPI.readData()
    return data
  }
  return null
}

export async function saveData(data) {
  if (window.paydayAPI) {
    await window.paydayAPI.writeData(data)
  }
}

export function emptyData() {
  return {
    template: null,
    cycles: [],
    activeSession: null
  }
}
