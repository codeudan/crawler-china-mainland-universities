const fs = require('fs')
const request = require('request')
const iconv = require('iconv-lite')
const BufferHelper = require('bufferhelper')
const cheerio = require('cheerio')
const chalk = require('chalk')
const program = require('commander')

const max = 137
const host = 'https://gaokao.chsi.com.cn/sch/'
const finalData = {}

program
  .version('1.0.0', '-v, --version')
  .description('中国大陆高校列表爬虫')
  .option('-p, --path [path]', '导出路径，默认在用户目录')
  .parse(process.argv)

function load(url) {
  return new Promise((resolve, reject) => {
    const req = request(url)
    req.on('error', err => {
      reject(err)
    })
    req.on('response', res => {
      const bufferHelper = new BufferHelper()
      res.on('data', chunk => {
        bufferHelper.concat(chunk)
      })
      res.on('end', () => {
        const result = iconv.decode(bufferHelper.toBuffer(), 'UTF-8')
        resolve(result)
      })
    })
  })
}

function output() {
  let path = process.env.HOME
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


const promiseAll = []
for (let i = 0; i < max; i++) {
  promiseAll.push(new Promise(async (resolve, reject) => {
    load(`${host}search.do?searchType=1&start=${i * 20}`).then(html => {
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
      console.log(chalk.red(`第${i + 1}页下载成功`))
      resolve(pageData)
    }).catch(err => {
      console.log(chalk.red(`第${i + 1}页下载失败`))
      reject(err)
    })
  }))
}

Promise.all(promiseAll).then(pages => {
  pages.forEach(page => {
    page.forEach(item => {
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
