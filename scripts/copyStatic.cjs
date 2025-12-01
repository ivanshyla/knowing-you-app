const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const standaloneDir = path.join(projectRoot, '.next', 'standalone')

function copyDir(source, destination) {
  if (!fs.existsSync(source)) {
    return
  }
  fs.rmSync(destination, { recursive: true, force: true })
  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
}

if (!fs.existsSync(standaloneDir)) {
  console.error('Standalone build not found. Run `next build` before copying static assets.')
  process.exit(1)
}

const staticSource = path.join(projectRoot, '.next', 'static')
const staticTarget = path.join(standaloneDir, '.next', 'static')
const publicSource = path.join(projectRoot, 'public')
const publicTarget = path.join(standaloneDir, 'public')

copyDir(staticSource, staticTarget)
copyDir(publicSource, publicTarget)

console.log('Standalone assets copied.')

