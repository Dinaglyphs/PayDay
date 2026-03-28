const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('paydayAPI', {
  readData:         ()               => ipcRenderer.invoke('read-data'),
  writeData:        (data)           => ipcRenderer.invoke('write-data', data),
  exportXlsx:       (cycleData, currencySymbol) => ipcRenderer.invoke('export-xlsx', { cycleData, currencySymbol }),
  exportPDF:        (cycleData, currencySymbol) => ipcRenderer.invoke('export-pdf',  { cycleData, currencySymbol }),
  uploadPayslip:    (opts)           => ipcRenderer.invoke('upload-payslip', opts),
  downloadPayslip:  (opts)           => ipcRenderer.invoke('download-payslip', opts),
  deletePayslip:    (opts)           => ipcRenderer.invoke('delete-payslip', opts),
})
