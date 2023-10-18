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

// 处理 POST 请求，路由为 '/video'
app.post('/video', async (req, res) => {
    const urls = req.body.urls;
    if (!urls) {
        return res.status(400).json({ success: false, status: 'Bad Request - 缺少 urls 参数' });
    }

    const urlsArray = urls.split(',');

    try {
        const video_list = await processVideoLinks(urlsArray);
        if (video_list["video_count"] == 0) {
            res.json({ success: false, status: '输入的所有url都无效', video_list, video_count: video_list.length });
        }
        else {
            res.json({ success: true, status: 'OK', video_list, video_count: video_list.length });
        }
        
    } catch (error) {
        console.error(`处理视频链接时出错: ${error.message}`);
        res.status(500).json({ success: false, status: '服务器内部错误' });
    }
});

// 使用 Express 提供的静态文件中间件，将 'public' 文件夹设置为静态资源路径
app.use(express.static(path.join(__dirname, 'public')));

// 从 URL 中提取视频ID
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

// 处理视频链接数组
async function processVideoLinks(videoLinks) {
    const video_list = [];

    for (const videoLink of videoLinks) {
        const videoUrl = videoLink.trim();
        if (!videoUrl) {
            continue; // 跳过空的 videoLink
        }

        try {
            const uuid = getID(await openPage(videoUrl, false));

            if (!uuid) {
                console.error(`ID - ${videoUrl}`);
                continue; // 跳过没有ID的视频
            }

            const itemInfoResponse = await openPage(`https://www.douyin.com/web/api/v2/aweme/iteminfo/?reflow_source=reflow_page&item_ids=${uuid}&a_bogus=666666666`);
            const itemInfo = JSON.parse(itemInfoResponse).item_list[0];
            const videoId = itemInfo.video.play_addr.uri;
            const finalVideoUrl = `https://aweme.snssdk.com/aweme/v1/play/?video_id=${videoId}`;
            const desc = itemInfo.desc;
            video_list.push({
                videoUrl: finalVideoUrl,
                videoId: parseInt(uuid),
                desc
            });
        } catch (error) {
            console.error(`处理视频链接时出错 - ${videoUrl}: ${error.message}`);
            video_list.push({
                error: `处理视频链接时出错 - ${videoUrl}: ${error.message}`
            });
        }
    }

    return video_list;
}

// 监听指定端口
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
