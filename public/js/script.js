$(document).ready(function () {
    // 当表单提交时触发事件
    $(".img").hide();
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
                url: '/parse',
                data: { urls: cUrl },
                dataType: "json",
                success: function (js) {
                    $(".viewBody").empty()
                    $('#videoListUl').empty()
                    js["itemList"].forEach(function (item) {
                        if (item["type"] == 0) {
                            var decodedUrl = item["url"]
                            label = $('<video class="player" width="640" height="360" src="' + decodedUrl + '" controls></video>')
                            $(".viewBody").append(label)
                            $('#videoListUl').append('<li><a href="' + decodedUrl + '" download>下载视频</a> - ' + decodedUrl + '</li>');
                        }
                        else if (item["type"] == 1) {
                            item["imgs"].forEach(function (img) {
                                var decodedUrl = img["url"]
                                label = $('<img class="img" width="' + img["width"] / 3 +'" height="' + img["height"] / 3 +'" src="'+decodedUrl+'" style="display: inline;">')
                                $(".viewBody").append(label)
                                $('#videoListUl').append('<li><a href="' + decodedUrl + '" download>下载图片</a> - ' + decodedUrl + '</li>');
                            })
                        }
                        
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