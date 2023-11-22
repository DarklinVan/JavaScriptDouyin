const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const morgan = require('morgan');

// 创建一个 Express 应用
const app = express();

// 使用 body-parser 中间件来解析请求体
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 确定端口号，从环境变量中获取，如果没有则默认使用 3000 端口
const PORT = process.env.PORT || 3000;

app.use(morgan(':custom'));

// 处理 POST 请求，路由为 '/parse'
app.post('/parse', async (req, res) => {
    const urls = req.body.urls;
    if (!urls) {
        return res.status(400).json({ success: false, status: 'Bad Request - 缺少 urls 参数' });
    }

   

    try {
        const urlsArray = urls.split(',');
        const itemList = await processItemLinks(urlsArray);
        if (itemList["video_count"] == 0) {
            res.json({ success: false, status: '输入的所有url都无效', itemList, count: itemList.length });
        }
        else {
            res.json({ success: true, status: 'OK', itemList, count: itemList.length });
        }

    } catch (error) {
        console.error(`处理视频链接时出错: ${error.message}`);
        res.status(500).json({ success: false, status: '服务器内部错误' });
    }
});

// 使用 Express 提供的静态文件中间件，将 'public' 文件夹设置为静态资源路径
app.use(express.static(path.join(__dirname, 'public')));

// 从 URL 中提取 ID
function getID(text) {
    const pattern = /\/(\d+)\//;
    const match = text.match(pattern);

    return match ? match[1] : "";
}


// 自定义日志格式
morgan.token('custom', (req, res) => {
    const { method, url, body, query } = req;
    const { statusCode, statusMessage } = res;
    const now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''); // 缩短时间格式
    return `${now} - Client: ${req.ip} - Method: ${method} - URL: ${url} - Body: ${JSON.stringify(body)} - Query: ${JSON.stringify(query)} - Status: ${statusCode} ${statusMessage}`;
});

// 发起 HTTP 请求并返回页面内容的 Promise
function openPage(url, ar = true) {
    return new Promise((resolve, reject) => {
        const headers = {
            'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        };

        request({ url, headers, followRedirect: ar }, (error, response, body) => {
            if (error) {
                console.error(`错误: ${error}`);
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}

// 处理链接数组
async function processItemLinks(itemLinks) {
    const itemLists = [];

    for (const itemLink of itemLinks) {
        const itemUrl = itemLink.trim();
        if (!itemUrl) {
            continue; // 跳过空的 Link
        }
        try {
            const uuid = getID(await openPage(itemUrl, false));

            if (!uuid) {
                console.error(`ID - ${itemUrl}`);
                continue; // 跳过没有ID的
            }

            const itemInfoResponse = await openPage(`https://www.douyin.com/web/api/v2/aweme/iteminfo/?reflow_source=reflow_page&item_ids=${uuid}&a_bogus=666666666`);
            const itemList = JSON.parse(itemInfoResponse).item_list[0];
            const desc = itemList.desc;
            if (itemList.images) {
                const imgList = []
                for (const item of itemList.images) {
                    imgList.push({
                        url: item.url_list[3],
                        height: item.height,
                        width: item.width,
                    })
                }
                itemLists.push({
                    type:1,
                    imgs: imgList,
                    itemId: parseInt(uuid),
                    desc
                })
            } else {
                const itemId = itemList.video.play_addr.uri;
                const finalItemUrl = `https://aweme.snssdk.com/aweme/v1/play/?video_id=${itemId}`;
                
                itemLists.push({
                    type:0,
                    url: finalItemUrl,
                    itemId: parseInt(uuid),
                    desc
                });
            }

        } catch (error) {
            console.error(`处理视频链接时出错 - ${itemUrl}: ${error.message}`);
            itemLists.push({
                error: `处理视频链接时出错 - ${itemUrl}: ${error.message}`
            });
        }
    }

    return itemLists;
}

// 监听指定端口
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
