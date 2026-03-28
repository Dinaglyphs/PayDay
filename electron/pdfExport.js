const { PDFDocument, rgb, StandardFonts } = require('pdf-lib')
const fs = require('fs')

async function generateCyclePDF(cycle, outputPath, currencySymbol = '£') {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // Brand colour palette
  const bgBase        = rgb(0.051, 0, 0.063)     // #0D0010
  const bgCard        = rgb(0.102, 0, 0.137)     // #1A0023
  const bgCardAlt     = rgb(0.133, 0, 0.176)     // #220030
  const bgHeader      = rgb(0.071, 0, 0.098)     // #120019
  const magenta       = rgb(0.6, 0, 0.6)         // #990099
  const fuchsia       = rgb(0.8, 0.2, 0.6)       // #CC3399
  const patriarch     = rgb(0.4, 0, 0.4)         // #660066
  const textPrimary   = rgb(0.96, 0.941, 1.0)    // #F5F0FF
  const textSecondary = rgb(0.784, 0.784, 0.784) // #C8C8C8
  const textMuted     = rgb(0.5, 0.5, 0.5)
  const sortedGreen   = rgb(0.576, 0.788, 0.353) // #93C95A
  const pendingAmber  = rgb(0.961, 0.725, 0.255) // #F5B942
  const skippedRed    = rgb(0.941, 0.42, 0.416)  // #F06B6A

  const margin   = 40
  const colWidth = width - margin * 2
  let y = height - 40
  let currentPage = page

  const getPage = () => currentPage

  const drawRect = (x, yPos, w, h, color) => {
    getPage().drawRectangle({ x, y: yPos, width: w, height: h, color })
  }

  const drawText = (text, x, yPos, size, font, color) => {
    getPage().drawText(String(text ?? ''), { x, y: yPos, size, font, color })
  }

  const checkPageBreak = (needed) => {
    if (y - needed < 60) {
      currentPage = pdfDoc.addPage([595.28, 841.89])
      drawRect(0, 0, width, currentPage.getSize().height, bgBase)
      y = currentPage.getSize().height - 40
    }
  }

  const fmt = (n) => `${currencySymbol}${Number(n || 0).toFixed(2)}`

  // ─── FULL PAGE BACKGROUND ───────────────────────────────────────────────
  drawRect(0, 0, width, height, bgBase)

  // ─── HEADER BAND ────────────────────────────────────────────────────────
  const headerH = 64
  drawRect(0, height - headerH, width, headerH, bgHeader)
  // magenta accent line under header
  drawRect(0, height - headerH - 2, width, 2, magenta)
  // left accent bar
  drawRect(0, height - headerH, 4, headerH, fuchsia)

  // App name: "PayDay"
  drawText('PayDay', margin, height - 26, 22, fontBold, textPrimary)
  // "by Dinaglyphs" superscript italic fuchsia
  drawText('by Dinaglyphs', margin + 78, height - 18, 9, fontOblique, fuchsia)

  // Right: "Cycle Report" label + date
  drawText('Cycle Report', width - margin - 110, height - 22, 10, fontRegular, rgb(0.6, 0.4, 0.7))
  drawText(cycle.date || '', width - margin - 80, height - 36, 12, fontBold, textPrimary)

  y = height - headerH - 22

  // ─── INCOME SUMMARY CARDS ───────────────────────────────────────────────
  const confirmedOut = (cycle.bills || [])
    .filter(b => b.status === 'sorted')
    .reduce((s, b) => s + (parseFloat(b.actual) || 0), 0)
  const pendingTotal = (cycle.bills || [])
    .filter(b => b.status === 'pending')
    .reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)
  const remaining = (cycle.totalIncome || 0) - confirmedOut - pendingTotal

  const cards = [
    { label: 'Total income',  value: fmt(cycle.totalIncome), color: textPrimary },
    { label: 'Confirmed out', value: fmt(confirmedOut),      color: sortedGreen },
    { label: 'Remaining',     value: fmt(remaining),         color: remaining >= 0 ? pendingAmber : skippedRed }
  ]

  const cardW = (colWidth - 16) / 3
  cards.forEach((card, i) => {
    const cx = margin + i * (cardW + 8)
    const cy = y - 52
    drawRect(cx, cy, cardW, 48, bgCard)
    drawRect(cx, cy + 47, cardW, 1, patriarch)
    drawText(card.label.toUpperCase(), cx + 10, cy + 34, 7, fontRegular, rgb(0.6, 0.4, 0.7))
    drawText(card.value, cx + 10, cy + 14, 14, fontBold, card.color)
  })
  y -= 72

  // ─── BILLS SECTION ──────────────────────────────────────────────────────
  checkPageBreak(50)
  drawText('BILLS', margin, y, 9, fontBold, fuchsia)
  drawRect(margin, y - 3, 28, 1, fuchsia)
  y -= 18

  drawRect(margin, y - 8, colWidth, 22, patriarch)
  drawRect(margin, y + 14, colWidth, 1, magenta)
  drawText('BILL',     margin + 8,   y, 7, fontBold, textPrimary)
  drawText('CATEGORY', margin + 165, y, 7, fontBold, textPrimary)
  drawText('BUDGETED', margin + 285, y, 7, fontBold, textPrimary)
  drawText('ACTUAL',   margin + 355, y, 7, fontBold, textPrimary)
  drawText('STATUS',   margin + 425, y, 7, fontBold, textPrimary)
  y -= 22

  const statusOrder = ['sorted', 'pending', 'skipped', 'untouched']
  const sortedBills = [...(cycle.bills || [])].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  )

  sortedBills.forEach((bill, i) => {
    checkPageBreak(22)
    const rowBg = i % 2 === 0 ? bgCard : bgCardAlt
    drawRect(margin, y - 8, colWidth, 20, rowBg)

    const barColor = bill.status === 'sorted'  ? sortedGreen
      : bill.status === 'pending' ? pendingAmber
      : bill.status === 'skipped' ? skippedRed
      : textMuted
    drawRect(margin, y - 8, 3, 20, barColor)

    const statusColor = barColor
    const statusLabel = bill.status
      ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1)
      : 'Untouched'

    drawText(bill.name || '',     margin + 10,  y, 8, fontRegular, textPrimary)
    drawText(bill.category || '', margin + 165, y, 8, fontRegular, textSecondary)
    drawText(fmt(bill.budgeted),  margin + 285, y, 8, fontRegular, textSecondary)
    drawText(fmt(bill.actual),    margin + 355, y, 8, fontBold,    textPrimary)
    drawText(statusLabel,         margin + 425, y, 8, fontBold,    statusColor)
    y -= 20
  })

  // Totals row
  checkPageBreak(26)
  drawRect(margin, y - 8, colWidth, 22, bgHeader)
  drawRect(margin, y + 14, colWidth, 1, patriarch)
  drawRect(margin, y - 8, colWidth, 1, patriarch)

  const sortedT = sortedBills.filter(b => b.status === 'sorted').reduce((s, b) => s + (parseFloat(b.actual) || 0), 0)
  const pendingT = sortedBills.filter(b => b.status === 'pending').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)
  const skippedT = sortedBills.filter(b => b.status === 'skipped').reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0)
  const unalloc  = remaining - skippedT

  drawText(`Sorted: ${fmt(sortedT)}`,      margin + 8,   y, 8, fontBold, sortedGreen)
  drawText(`Pending: ${fmt(pendingT)}`,    margin + 120, y, 8, fontBold, pendingAmber)
  drawText(`Skipped: ${fmt(skippedT)}`,    margin + 240, y, 8, fontBold, skippedRed)
  drawText(`Unallocated: ${fmt(unalloc)}`, margin + 360, y, 8, fontBold, textPrimary)
  y -= 30

  // ─── DEBT PAYMENTS ──────────────────────────────────────────────────────
  if (cycle.debtPayments && cycle.debtPayments.length > 0) {
    checkPageBreak(60)
    drawText('DEBT PAYMENTS THIS CYCLE', margin, y, 9, fontBold, fuchsia)
    drawRect(margin, y - 3, 90, 1, fuchsia)
    y -= 18

    drawRect(margin, y - 8, colWidth, 22, patriarch)
    drawRect(margin, y + 14, colWidth, 1, magenta)
    drawText('DEBT',        margin + 8,   y, 7, fontBold, textPrimary)
    drawText('AMOUNT PAID', margin + 430, y, 7, fontBold, textPrimary)
    y -= 22

    cycle.debtPayments.forEach((p, i) => {
      checkPageBreak(22)
      drawRect(margin, y - 8, colWidth, 20, i % 2 === 0 ? bgCard : bgCardAlt)
      drawRect(margin, y - 8, 3, 20, sortedGreen)
      drawText(p.debtName || '',  margin + 10,  y, 8, fontRegular, textPrimary)
      drawText(fmt(p.amountPaid), margin + 430, y, 8, fontBold,    sortedGreen)
      y -= 20
    })
    y -= 12
  }

  // ─── DEBT SNAPSHOT ──────────────────────────────────────────────────────
  if (cycle.debtSnapshots && cycle.debtSnapshots.length > 0) {
    checkPageBreak(60)
    drawText('DEBT SNAPSHOT AT CLOSE', margin, y, 9, fontBold, fuchsia)
    drawRect(margin, y - 3, 82, 1, fuchsia)
    y -= 18

    drawRect(margin, y - 8, colWidth, 22, patriarch)
    drawRect(margin, y + 14, colWidth, 1, magenta)
    drawText('DEBT',    margin + 8,   y, 7, fontBold, textPrimary)
    drawText('BALANCE', margin + 430, y, 7, fontBold, textPrimary)
    y -= 22

    cycle.debtSnapshots.forEach((d, i) => {
      checkPageBreak(22)
      drawRect(margin, y - 8, colWidth, 20, i % 2 === 0 ? bgCard : bgCardAlt)
      drawRect(margin, y - 8, 3, 20, skippedRed)
      drawText(d.name || '',   margin + 10,  y, 8, fontRegular, textPrimary)
      drawText(fmt(d.balance), margin + 430, y, 8, fontBold,    skippedRed)
      y -= 20
    })
  }

  // ─── FOOTER BAND ────────────────────────────────────────────────────────
  const footerY = 36
  drawRect(0, 0, width, footerY, bgHeader)
  drawRect(0, footerY, width, 1, patriarch)
  drawRect(0, footerY - 1, 4, footerY, fuchsia)

  drawText('Generated by PayDay by Dinaglyphs', margin, 22, 7, fontRegular, textMuted)
  drawText(`Exported on ${new Date().toLocaleDateString('en-GB')}`, margin, 10, 7, fontRegular, textMuted)

  drawText('Vibecoded by', width - margin - 175, 22, 7, fontRegular, textMuted)
  drawText('Opeyemi Daniel Abatan', width - margin - 130, 22, 7, fontOblique, rgb(0.6, 0.3, 0.7))
  drawText('@dinaglyphs', width - margin - 60, 10, 7, fontOblique, rgb(0.5, 0.2, 0.6))

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes))
}

module.exports = { generateCyclePDF }
