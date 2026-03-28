const sharp        = require('sharp')
const pngToIcoMod  = require('png-to-ico')
const pngToIco     = pngToIcoMod.default || pngToIcoMod.imagesToIco || pngToIcoMod
const fs       = require('fs')
const path     = require('path')

async function generateIcons() {
  const sourcePath = path.join(__dirname, '../public/icon-source.png')

  if (!fs.existsSync(sourcePath)) {
    console.error('Source icon not found at public/icon-source.png')
    console.error('Please copy your brand logo PNG to public/icon-source.png first.')
    process.exit(1)
  }

  const sizes = [16, 24, 32, 48, 64, 128, 256]
  console.log('Generating icon sizes from brand logo...')

  for (const size of sizes) {
    const outPath = path.join(__dirname, `../public/icon-${size}.png`)
    await sharp(sourcePath)
      .resize(size, size, { fit: 'contain', background: { r: 102, g: 0, b: 102, alpha: 1 } })
      .png()
      .toFile(outPath)
    console.log(`  ✓ ${size}x${size}`)
  }

  const mainPng = path.join(__dirname, '../public/icon.png')
  await sharp(sourcePath)
    .resize(256, 256, { fit: 'contain', background: { r: 102, g: 0, b: 102, alpha: 1 } })
    .png()
    .toFile(mainPng)
  console.log('  ✓ icon.png (256px main)')

  const icoSizes = [16, 32, 48, 256]
  const icoPaths = icoSizes.map(s => path.join(__dirname, `../public/icon-${s}.png`))

  console.log('\nGenerating .ico file...')
  const icoBuffer = await pngToIco(icoPaths)
  const icoPath   = path.join(__dirname, '../public/icon.ico')
  fs.writeFileSync(icoPath, icoBuffer)
  console.log('  ✓ icon.ico')

  await sharp(sourcePath)
    .resize(512, 512, { fit: 'contain', background: { r: 102, g: 0, b: 102, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, '../public/icon-512.png'))
  console.log('  ✓ icon-512.png')

  const stat = fs.statSync(icoPath)
  if (stat.size < 5000) {
    console.error('\n✗ icon.ico seems too small — something may have gone wrong')
    process.exit(1)
  }

  console.log('\nAll icons generated successfully.')
}

generateIcons().catch(err => {
  console.error('Icon generation failed:', err)
  process.exit(1)
})
