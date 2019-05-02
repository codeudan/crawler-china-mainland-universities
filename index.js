const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')
const chalk = require('chalk')
const program = require('commander')

const excludeList = ['香港', '澳门', '台湾']
const url = 'https://gaokao.chsi.com.cn/sch/'
const finalData = {}

program
  .version('1.0.0', '-v, --version')
  .description('中国大陆高校列表爬虫')
  .option('-p, --path [path]', '导出路径，默认在代码仓库目录')
  .parse(process.argv)

function load(url) {
  return new Promise((resolve, reject) => {
    const retryNum = 3
    const q = n => {
      const req = request({
        url,
        timeout: 5000,
      }, function(error, response, body) {
        if (error) {
          if (n < retryNum) {
            setTimeout(() => {
              q(n + 1)
            }, 1000)
            return
          }
          reject(error)
          return
        }
        resolve(body)
      })
    }
    q(0)
  })
}

function output() {
  let path = __dirname
  if (program.path) {
    path = program.path
  }
  const outputFilename = `${path}/china_mainland_universities.json`
  fs.writeFile(outputFilename, JSON.stringify(finalData, null, 2), err => {
    if (err) {
      console.error(err)
    }
    console.log(chalk.green(`全部数据下载成功，已保存到：${outputFilename}`))
  })
}

function load$(html) {
  return cheerio.load(html, { decodeEntities: false })
}

async function main() {
  let max = 0
  const html = await load(`${url}search.do?searchType=1&start=0`)
  const $ = load$(html)
  $('.lip').each((idx, lip) => {
    const $ = load$(lip)
    const current = Number($('a').text())
    if (current > max) {
      max = current
    }
  })
  const promiseAll = []
  for (let i = 0; i < max; i++) {
    promiseAll.push(new Promise(async (resolve, reject) => {
      load(`${url}search.do?searchType=1&start=${i * 20}`).then(html => {
        const $ = load$(html)
        const pageData = []
        $('.ch-table tr').each((idx, item) => {
          const $ = load$(item)
          if ($('.js-yxk-yxmc').length) {
            const name = $('.js-yxk-yxmc').text().trim()
            const region = $('.js-yxk-yxmc').next().text().trim()
            if (name && region) {
              pageData.push({
                name,
                region
              })
            }
          }
        })
        console.log(chalk.green(`✔ 第${i + 1}页`))
        resolve(pageData)
      }).catch(err => {
        console.log(chalk.red(`✘ 第${i + 1}页`))
        reject(err)
      })
    }))
  }

  Promise.all(promiseAll).then(pages => {
    pages.forEach(page => {
      page.forEach(item => {
        if (excludeList.indexOf(item.region) > -1) {
          return
        }
        finalData[item.region] = finalData[item.region] || { all: [] }
        if (finalData[item.region].all.indexOf(item.name) < 0) {
          finalData[item.region].all.push(item.name)
        }
      })
    })
    output()
  }).catch(err => {
    console.error(err)
    console.log(chalk.red(`下载错误`))
    process.exit(1)
  })
}

main().catch(err => {
  console.error(err)
  console.log(chalk.red(`下载错误`))
})
