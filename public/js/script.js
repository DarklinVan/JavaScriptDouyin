$(document).ready(function () {
    // 当表单提交时触发事件
    $('#videoPostForm').submit(function (event) {
        // 阻止默认的表单提交行为
        event.preventDefault();

        // 获取表单数据
        var formData = decodeURIComponent($('#videoPostForm').serialize());
        var urls = formData.match(/https:\/\/v\.douyin\.com\/[a-zA-Z0-9]+\/?/g);

        if (urls) {
            var cUrl = urls.join(",");
            $.ajax({
                type: 'POST',
                url: '/video',
                data: { urls: cUrl },
                dataType: "json",
                success: function (js) {
                    if (js["video_count"] == 1) {
                        videoUrl = js["video_list"][0]["videoUrl"];
                        $("#player").attr("src", videoUrl);
                    }
                    else if (js["video_count"] > 1) {
                        // 处理多个视频的情况
                    }
                    js["video_list"].forEach(function (url) {
                        var decodedUrl = url["videoUrl"]
                        $('#videoListUl').append('<li><a href="' + decodedUrl + '" download>下载视频</a> - ' + decodedUrl + '</li>');
                    });
                    // 显示处理结果，添加成功样式类
                    $('.result').removeClass('error').addClass('success').html('处理完成').show();
                },
                error: function (error) {
                    console.error(error);

                    // 显示错误信息，添加失败样式类
                    $('.result').removeClass('success').addClass('error').html('处理出错，请重试').show();
                }
            });
        } else {
            console.log("没有匹配到链接");

            // 显示没有匹配到链接的信息，添加失败样式类
            $('.result').removeClass('success').addClass('error').html('没有匹配到链接').show();
        }
    });
});