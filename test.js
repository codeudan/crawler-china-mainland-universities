const chalk = require('chalk')
const data = require('./china_mainland_universities.json')

test('test', () => {
	let all = 0
	Object.keys(data).forEach(p => {
		const alls = data[p].all
		alls.forEach((item, idx) => {
			all++
			expect((alls.indexOf(item))).toBe(idx)
		})
	})
	expect(Object.keys(data).length).toBe(31)
	console.log(chalk.green(`共计 ${Object.keys(data).length} 个省份`))
	console.log(chalk.green(`共计 ${all} 所大学`))
})
