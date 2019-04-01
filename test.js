const chalk = require('chalk')
const data = require('./china_mainland_universities.json')

let all = 0
Object.keys(data).forEach(p => {
  const alls = data[p].all
  alls.forEach((item, idx) => {
    if (alls.indexOf(item) !== idx) {
      console.log(chalk.red(`${item} 重复`))
    }
    all++
  })
})

console.log(chalk.green(`共计 ${Object.keys(data).length} 个省份`))
console.log(chalk.green(`共计 ${all} 所大学`))
