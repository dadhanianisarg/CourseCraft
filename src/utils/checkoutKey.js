const getStorageKey = (cartKey) => `coursecraft-checkout-${cartKey}`

export const getCheckoutKey = (cartKey) => {
  const storageKey = getStorageKey(cartKey)
  let key = sessionStorage.getItem(storageKey)

  if (!key) {
    key = window.crypto.randomUUID()
    sessionStorage.setItem(storageKey, key)
  }

  return key
}

export const clearCheckoutKey = (cartKey) => {
  sessionStorage.removeItem(getStorageKey(cartKey))
}
