# JavaScript for Douyin
一个用Node.js写的简易抖音视频连接解析器
采用MIT协议,支持部署到Vercel
[Demo网址](https://java-script-douyin.vercel.app/)
内含简易的UI网页
调用接口链接为/video，使用POST协议
## 输入参数
1."urls"
抖音的分享链接，如https://v.douyin.com/idSKrkhssG/
支持同时输入多个，用","隔开
## 返回数据样例
- 成功获取
其中，success为是否获取成功
status是状态文本
video_list是包含了成功获取的视频链接的列表
desc是视频简介（文案）
video_count是成功获取到的视频数量
```
{
    "success": true,
    "status": "OK",
    "video_list": [
        {
            "videoUrl": "https://aweme.snssdk.com/aweme/v1/play/?video_id=v0300fg10000cjkncubc77u5dpcl4v5g",
            "videoId": 7271474365852683000,
            "desc": "《亻 尔 女 🐎》\n#战争雷霆 #暑假就该这么玩 #热点小助手 #网络游戏 #战争"
        }
    ],
    "video_count": 1
}
```
- 获取失败
```
{
    "success": false,
    "status": "输入的所有url都无效",
    "video_list": [],
    "video_count": 0
}
```


