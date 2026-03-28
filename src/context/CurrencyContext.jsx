import React, { createContext, useContext, useState } from 'react'
import { CURRENCIES } from '../constants/currencies'

const CurrencyContext = createContext()

export function CurrencyProvider({ children, initialCurrency = 'GBP' }) {
  const [currencyCode, setCurrencyCode] = useState(initialCurrency)

  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0]

  const formatAmount = (amount) => {
    const num = Number(amount || 0)
    return `${currency.symbol}${num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  return (
    <CurrencyContext.Provider value={{
      currencyCode,
      setCurrencyCode,
      symbol: currency.symbol,
      formatAmount,
      currencies: CURRENCIES
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
