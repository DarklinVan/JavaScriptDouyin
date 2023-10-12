const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

// 添加body-parser中间件
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const PORT = 3000; // 使用环境变量中的端口，或者默认使用 3000

app.post('/video', async (req, res) => {
    const urls = req.body.urls;
    if (!urls) {
        return res.status(400).json({ success: false, status: 'Bad Request - Missing urls parameter' });
    }

    const urlsArray = urls.split(',');

    try {
        const video_list = await processVideoLinks(urlsArray);
        res.json({ success: true, status: 'OK', video_list, video_count: video_list.length });
    } catch (error) {
        console.error(`Error processing video links: ${error.message}`);
        res.status(500).json({ success: false, status: 'Internal Server Error' });
    }
});

app.use(express.static('public'));

function getID(text) {
    const pattern = /\/(\d+)\//;
    const match = text.match(pattern);

    return match ? match[1] : "";
}

function openPage(url, ar = true) {
    return new Promise((resolve, reject) => {
        const headers = {
            'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        };

        request({ url, headers, followRedirect: ar }, (error, response, body) => {
            if (error) {
                console.error(`�������쳣: ${error}`);
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}

async function processVideoLinks(videoLinks) {
    const video_list = [];

    for (const videoLink of videoLinks) {
        const videoUrl = videoLink.trim();
        if (!videoUrl) {
            continue; // Skip empty videoLink
        }

        try {
            const uuid = getID(await openPage(videoUrl, false));

            if (!uuid) {
                console.error(`ID - ${videoUrl}`);
                continue; // Skip videos without ID
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
            console.error(`Error processing video link - ${videoUrl}: ${error.message}`);
            video_list.push({
                error: `Error processing video link - ${videoUrl}: ${error.message}`
            });
        }
    }

    return video_list;
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

