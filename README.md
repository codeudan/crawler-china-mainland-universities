# 中国大陆高校列表爬虫
中国大陆高校列表爬虫，导出格式为 JSON，名称是 china_mainland_universities.json

## 准备
安装 node.js

## 使用
git clone

cd crawler-china-mainland-universities

npm install

node index.js

## 选项

### 查看帮助
node index.js -h

### 将高校分类为 本科、专科、独立、民办
node index.js -c

### 指定输出文件目录
node index.js -p [path]

### Debug 模式
node index.js -d
Debug 模式，无论是否完全下载成功，都将导出数据
