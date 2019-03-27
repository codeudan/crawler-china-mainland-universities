const fs = require('fs')
const request = require('request')
const iconv = require('iconv-lite')
const BufferHelper = require('bufferhelper')
const cheerio = require('cheerio')
const chalk = require('chalk')
const program = require('commander')

const index = 'http://www.huaue.com/gxmd.htm'
const data = {}

program
  .version('1.0.0', '-v, --version')
  .description('中国大陆高校列表爬虫')
  .option('-c, --classify', '按本科、专科、独立、民办分类')
  .option('-p, --path [path]', '导出路径，默认在用户目录')
  .option('-d, --debug', 'debug 模式，无论是否完全下载成功，都将导出数据')
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
        const result = iconv.decode(bufferHelper.toBuffer(), 'GBK')
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
  console.log(outputFilename)
  fs.writeFile(outputFilename, JSON.stringify(data, null, 2), err => {
    if (err) {
      console.error(err)
    }
    console.log(chalk.green(`下载成功，已保持到：${outputFilename}`))
  })
}

async function main() {
  const indexHtml = await load(index)
  const indexStr = indexHtml.match(/<table cellSpacing="1" width="960" bgColor="#cccccc" border="0" id="table2">([\w\W]*?)<\/table>/)[1]
  let entries = indexStr.match(/<td align="middle" width="20%" bgColor="#FFFFFF" height="35">([\w\W]*?)<\/td>/g)
  if (!entries.length) {
    reject()
    return
  }
  const promiseAll = []
  entries.forEach(entry => {
    promiseAll.push(new Promise((resolve, reject) => {
      const $entry = cheerio.load(entry)('a')[0]
      if ($entry) {
        const url = $entry.attribs.href
        const pName = $entry.children[0].data
        if (pName === '香港高校名单' ||
          pName === '澳门高校名单' ||
          pName === '台湾高校名单') {
          resolve()
          return
        }
        console.log(chalk.blue(`开始下载：${pName}`))
        data[pName] = {
          all: [],
        }
        if (program.classify) {
          data[pName].bk = []
          data[pName].zk = []
          data[pName].dl = []
          data[pName].mb = []
        }
        load(url).then(indexHtml => {
          const str = indexHtml.match(/<\/head>([\w\W]*?)<\/boby>/)[1]
          const $index = cheerio.load(str, { decodeEntities: false });
          ['hn', 'zw', 'zg', 'zz'].forEach(type => {
            const $zz = $index(`table#Change_${type}`)
            const zzHtml = $zz.html()
            if (zzHtml) {
              const zzNames = zzHtml.match(/target="_blank">(\p{Unified_Ideograph}*?)<\/a>/gu)
              if (zzNames) {
                zzNames.forEach(name => {
                  let result = name.replace('target="_blank">', '').replace('</a>', '')
                  if (program.classify) {
                    if (type === 'hn') {
                      data[pName].bk.push(result)
                    }
                    if (type === 'zw') {
                      data[pName].zk.push(result)
                    }
                    if (type === 'zg') {
                      data[pName].dl.push(result)
                    }
                    if (type === 'zz') {
                      data[pName].mb.push(result)
                    }
                  }
                  if (data[pName].all.indexOf(result) < 0) {
                    data[pName].all.push(result)
                  }
                })
              }
            }
          })
          resolve()
        }).catch(err => {
          console.error(err)
          console.log(chalk.red(`下载错误：${pName}`))
          reject()
        })
      } else {
        resolve()
      }
    }))
  })
  Promise.all(promiseAll).then(() => {
    output()
  }).catch(err => {
    console.log(chalk.red(`下载错误`))
    if (program.debug) {
      output()
    }
  })
}

main().catch(() => {
  console.log(chalk.red('加载 index 错误'))
})
