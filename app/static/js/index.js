
document.addEventListener('DOMContentLoaded', () => {
        const memoListElement = document.getElementById('memo-list');
    const addMemoButton = document.getElementById('add-memo');
    const memoDetailContent = document.getElementById('memo-detail-content');

    let currentSelectedIndex = null;

        function loadMemos() {
        const memos = JSON.parse(localStorage.getItem('memos')) || [];
        memoListElement.innerHTML = '';

        memos.forEach((memo, index) => {
            const li = document.createElement('li');
            li.className = 'memo-item';
            li.setAttribute('data-index', index);

            const memoText = document.createElement('span');
            memoText.textContent = memo.content || '无内容';

            const dateTime = document.createElement('div');
            dateTime.className = 'memo-datetime';
            dateTime.textContent = `创建于: ${new Date(memo.created_at).toLocaleString()}`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '✕';
            deleteButton.className = 'delete-memo';
            deleteButton.setAttribute('data-index', index);

            li.appendChild(memoText);
            li.appendChild(dateTime);
            li.appendChild(deleteButton);
            memoListElement.appendChild(li);

                        requestAnimationFrame(() => {
                li.classList.add('fade-in');
            });
        });

                if (currentSelectedIndex !== null && !memos[currentSelectedIndex]) {
            currentSelectedIndex = null;
            memoDetailContent.textContent = '请选择一个备忘录以查看详情。';
            memoDetailContent.contentEditable = 'false';
        }
    }

        function addMemo() {
        const memos = JSON.parse(localStorage.getItem('memos')) || [];
        const newMemo = {
            content: '',
            created_at: new Date().getTime()
        };
        memos.push(newMemo);
        localStorage.setItem('memos', JSON.stringify(memos));
        loadMemos();
                showMemoDetail(memos.length - 1);
    }

        function deleteMemo(index) {
        let memos = JSON.parse(localStorage.getItem('memos')) || [];
        memos.splice(index, 1);
        localStorage.setItem('memos', JSON.stringify(memos));

                const memoItems = document.querySelectorAll('.memo-item');
        memoItems.forEach(item => {
            if (item.getAttribute('data-index') == index) {
                item.classList.add('fade-out');
                item.addEventListener('animationend', () => {
                    loadMemos();
                });
            }
        });

                if (currentSelectedIndex == index) {
            currentSelectedIndex = null;
            memoDetailContent.textContent = '请选择一个备忘录以查看详情。';
            memoDetailContent.contentEditable = 'false';
        }
    }

        function showMemoDetail(index) {
        const memos = JSON.parse(localStorage.getItem('memos')) || [];
        const memo = memos[index];
        memoDetailContent.textContent = memo.content || '';
        memoDetailContent.contentEditable = 'true';
        currentSelectedIndex = index;

                memoDetailContent.focus();
    }

        function updateMemoContent(index, newContent) {
        const memos = JSON.parse(localStorage.getItem('memos')) || [];
        memos[index].content = newContent;
        localStorage.setItem('memos', JSON.stringify(memos));
    }

        addMemoButton.addEventListener('click', addMemo);

        memoListElement.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('delete-memo')) {
            const index = e.target.getAttribute('data-index');
            deleteMemo(index);
        }
    });

        memoListElement.addEventListener('click', (e) => {
                if (e.target && e.target.classList.contains('delete-memo')) {
            return;
        }

                const li = e.target.closest('.memo-item');
        if (li) {
            const index = li.getAttribute('data-index');
            showMemoDetail(index);

                        const allItems = document.querySelectorAll('.memo-item');
            allItems.forEach(item => item.classList.remove('active'));
            li.classList.add('active');
        }
    });

        memoDetailContent.addEventListener('input', () => {
        if (currentSelectedIndex !== null) {
            const newContent = memoDetailContent.textContent.trim();
                        updateMemoContent(currentSelectedIndex, newContent);
                        const memoItems = document.querySelectorAll('.memo-item');
            memoItems.forEach(item => {
                if (item.getAttribute('data-index') == currentSelectedIndex) {
                    const span = item.querySelector('span');
                    span.textContent = newContent || '无内容';
                }
            });
        }
    });

        loadMemos();

    
        const timeSuggestions = {
            0: ["主人，夜深了，思绪开始放缓。此时，是休息和恢复的时刻。让身体与心灵暂时放空，为明日的努力积蓄力量。"],
            1: ["夜深人静，是该关掉屏幕，放松身心的时候。确保充足的休息，明天才能以更好的状态继续前行。"],
            2: ["在这静谧的时光里，身体和思维都应当得到休息。放下手头的事务，给自己一段宁静的时光，帮助恢复活力。"],
            3: ["已是深夜，思维的速度开始减缓。此时不宜再进行复杂的思考，最好是让自己放松，准备迎接新的挑战。"],
            4: ["凌晨是夜晚的尾声，适合整理思绪，放空大脑。让自己准备好迎接新的清晨，恢复精力。"],
            5: ["清晨时分，开始新的一天之前，先给自己准备一顿营养的早餐。这样能为你的一天提供充足的能量。"],
            6: ["晨光初现，是规划今天任务的好时机。确保今天的目标明确，合理分配时间，才能高效工作。"],
            7: ["清晨，适合进行一次简单的晨跑或伸展运动，唤醒身体，启动思维。让你以最佳状态开始一天的科研工作。"],
            8: ["早晨是大脑最清晰的时段。现在是集中精力进行学习或实验的好时机，确保从一开始就抓住高效的机会。"],
            9: ["上午是你最充沛的精力时段。此时，抓紧时间进行重要的科研任务，集中精神解决难题。"],
            10: ["上午十点，适合进行一段短暂的休息，活动活动身体。保持良好的状态，才能在接下来的工作中更有精力。"],
            11: ["临近中午，思维可能开始疲惫。适时休息，补充水分，给自己短暂的喘息，这对接下来的工作至关重要。"],
            12: ["中午时分，正是补充营养的好时机。享用一顿健康的午餐，恢复精力，为下午的工作做准备。"],
            13: ["午后的时光，适合整理已完成的工作。查看实验进展，看看是否需要做出调整，保持任务的连贯性。"],
            14: ["午后，能量开始略有下降。此时可以考虑进行一次短暂的休息，走动走动，避免长时间的坐着影响工作效率。"],
            15: ["下午三点，适合进行一些需要耐心和细致的工作。此时集中精力，不被打扰，便能解决那些琐碎但重要的问题。"],
            16: ["下午四点，适合和同事或研究团队进行沟通，交流想法，合作解决问题。让团队协作带来新的启示。"],
            17: ["下午五点，整理今日工作进度，看看是否有需要调整的地方。为明天的任务做好准备，确保研究有条不紊。"],
            18: ["傍晚，放松身心，适当走动。与家人共度时光或进行轻松的活动，有助于平衡一天的紧张与放松。"],
            19: ["晚上七点，准备一顿晚餐，给自己补充足够的营养。好好享用美食，也能恢复思维，准备好迎接新一轮的工作。"],
            20: ["夜幕降临，适合做些轻松的活动，如阅读或冥想。让大脑放松，为明日的工作做好准备。"],
            21: ["晚上九点，适合回顾今天的工作和实验，进行总结。让思维更加清晰，发现今天可能遗漏的小细节。"],
            22: ["晚上十点，整理好所有的资料，检查是否遗漏了重要的事项。此时，不宜再做复杂的思考，最好准备休息。"],
            23: ["夜晚已深，逐渐进入休息状态。关闭所有不必要的设备，放松自己，准备好迎接新的一天。"]
        };

        const weatherSuggestions = {
        "晴": {
            "high": [
                "阳光明媚，记得涂抹防晒霜，保护肌肤不受紫外线伤害。",
                "晴天适合户外活动，拉斐尔建议您去公园散步或跑步。",
                "天空晴朗，是拍照的好时机，不妨记录下美好的瞬间。",
                "晴天心情舒畅，拉斐尔希望您享受这美好的一天。"
            ],
            "moderate": [
                "天气晴朗但不炽热，穿着轻便即可，保持舒适。",
                "晴天适合安排一些户外计划，拉斐尔建议您与朋友共度时光。",
                "晴天的能量充沛，适合开始新的项目或学习新技能。",
                "拉斐尔提醒您，晴天虽好，别忘了适当补水。"
            ],
            "low": [
                "天气晴朗但较凉，适合穿着轻薄的外套，保持温暖。",
                "晴天的空气清新，拉斐尔建议您进行户外呼吸新鲜空气。",
                "虽然晴朗，但温度较低，拉斐尔提醒您注意保暖。",
                "晴天夜晚较凉，适合在户外观星或享受夜晚的宁静。"
            ]
        },
        "多云": {
            "high": [
                "多云天气较为舒适，适合进行各种户外活动。",
                "拉斐尔建议您利用多云的天气，进行一次短途旅行。",
                "多云天气减少了紫外线伤害，但仍建议适当防晒。",
                "拉斐尔希望您在多云的日子里保持愉快的心情。"
            ],
            "moderate": [
                "多云天气适合进行室内活动，如阅读或学习新技能。",
                "拉斐尔提醒您，多云天气变化多端，注意携带雨具。",
                "多云的天空提供了柔和的光线，适合摄影。",
                "拉斐尔建议您利用多云的天气，进行一些轻松的户外活动。"
            ],
            "low": [
                "多云天气较为凉爽，适合穿着长袖衣物，保持温暖。",
                "拉斐尔提醒您，尽管天气多云，但外出时仍需注意安全。",
                "多云天气适合进行一些低强度的锻炼，如瑜伽或散步。",
                "拉斐尔希望您在多云的天气中找到内心的平静。"
            ]
        },
        "阴": {
            "high": [
                "阴天的光线柔和，适合进行创意活动，如绘画或写作。",
                "拉斐尔建议您利用阴天的氛围，进行深度思考或学习。",
                "阴天虽然没有阳光，但依然是美好的一天，保持积极心态。",
                "拉斐尔提醒您，阴天适合与朋友或家人共度时光。"
            ],
            "moderate": [
                "阴天适合穿着轻便的外套，保持舒适。",
                "拉斐尔建议您在阴天进行一些室内活动，如看书或听音乐。",
                "阴天的空气湿润，拉斐尔提醒您注意室内通风。",
                "拉斐尔希望您在阴天里依然能找到快乐和满足。"
            ],
            "low": [
                "阴天较为凉爽，建议穿着保暖的衣物。",
                "拉斐尔提醒您，阴天可能伴有轻微的降温，注意增添衣物。",
                "阴天适合进行一些温和的运动，如瑜伽或太极。",
                "拉斐尔希望您在阴天里依然能保持积极的心态。"
            ]
        },
        "雨": {
            "high": [
                "大雨来临，记得携带雨具，避免淋湿。",
                "拉斐尔建议您在雨天保持温暖，适当穿着防水衣物。",
                "雨天适合进行一些室内活动，如看电影或阅读。",
                "拉斐尔提醒您，雨天道路湿滑，行走时请注意安全。"
            ],
            "moderate": [
                "中雨时，穿着防水的鞋子和外套，保持干燥。",
                "拉斐尔建议您在中雨天气里进行一些轻松的室内活动。",
                "中雨天气适合泡一杯热茶，享受片刻的宁静。",
                "拉斐尔提醒您，雨天出行时请保持警惕，注意交通安全。"
            ],
            "low": [
                "小雨时，穿着轻便的雨具即可，保持舒适。",
                "拉斐尔建议您在小雨天气中进行一些散步，感受雨的气息。",
                "小雨天气适合进行户外摄影，捕捉雨中的美景。",
                "拉斐尔提醒您，雨天注意路面湿滑，行走时请小心。"
            ]
        },
        "雪": {
            "high": [
                "大雪覆盖，穿着厚实的保暖衣物，确保身体温暖。",
                "拉斐尔建议您在大雪天气中进行一些室内活动，避免出行风险。",
                "雪天适合拍摄美丽的雪景，记录下冬日的美好。",
                "拉斐尔提醒您，雪天行走时请注意防滑，保持安全。"
            ],
            "moderate": [
                "中雪时，穿着保暖且防滑的鞋子，保持身体温暖。",
                "拉斐尔建议您在中雪天气中享受一杯热饮，舒缓身心。",
                "雪天适合进行一些轻松的户外活动，如堆雪人或打雪仗。",
                "拉斐尔提醒您，雪天出行时请提前规划路线，确保安全。"
            ],
            "low": [
                "小雪时，穿着适当的保暖衣物，保持舒适。",
                "拉斐尔建议您在小雪天气中进行一些温和的户外活动，享受雪的美景。",
                "雪天适合进行室内阅读或学习，利用时间提升自我。",
                "拉斐尔提醒您，雪天注意道路湿滑，行走时请小心。"
            ]
        },
        "雷": {
            "high": [
                "雷暴来临，尽量避免户外活动，保持安全。",
                "拉斐尔建议您在雷暴天气中寻找安全的室内场所避雨。",
                "雷暴天气适合进行一些静态活动，如阅读或冥想。",
                "拉斐尔提醒您，雷暴期间，请勿使用电子设备，以防雷击。"
            ],
            "moderate": [
                "雷阵雨时，穿着防水的衣物，避免暴露在户外。",
                "拉斐尔建议您在雷阵雨天气中保持冷静，避免惊慌。",
                "雷阵雨适合进行一些轻松的室内活动，如绘画或写作。",
                "拉斐尔提醒您，雷暴天气请勿靠近高大物体，确保安全。"
            ],
            "low": [
                "小雷雨时，穿着适当的雨具，保持干燥。",
                "拉斐尔建议您在小雷雨天气中进行一些温和的户外活动，注意安全。",
                "雷雨天气适合享受一杯热饮，舒缓心情。",
                "拉斐尔提醒您，雷雨期间请勿靠近水源，保持安全距离。"
            ]
        },
        "雾": {
            "high": [
                "浓雾来临，行车时请开启雾灯，保持安全距离。",
                "拉斐尔建议您在浓雾天气中减少外出，确保自身安全。",
                "浓雾天气适合进行一些室内活动，如学习或阅读。",
                "拉斐尔提醒您，浓雾期间请保持清醒，避免疲劳驾驶。"
            ],
            "moderate": [
                "中度雾时，穿着适当的衣物，保持温暖。",
                "拉斐尔建议您在中度雾天气中注意行走和驾驶安全。",
                "雾天适合进行一些低强度的室内活动，如看电影或听音乐。",
                "拉斐尔提醒您，雾天行走时请穿着反光衣物，确保安全。"
            ],
            "low": [
                "轻雾时，穿着舒适的衣物，保持清爽。",
                "拉斐尔建议您在轻雾天气中享受户外活动，呼吸新鲜空气。",
                "轻雾天气适合进行一些轻松的户外运动，如散步或慢跑。",
                "拉斐尔提醒您，雾天行走时请注意周围环境，确保安全。"
            ]
        },
        "沉雾": {
            "high": [
                "沉雾天气非常浓厚，建议您尽量避免外出。",
                "拉斐尔建议您在沉雾天气中保持温暖，待在室内。",
                "沉雾天气适合进行一些安静的室内活动，如冥想或瑜伽。",
                "拉斐尔提醒您，沉雾期间请勿驾驶，确保自身安全。"
            ],
            "moderate": [
                "中度沉雾时，穿着适当的衣物，保持温暖。",
                "拉斐尔建议您在中度沉雾天气中注意室内通风。",
                "沉雾天气适合进行一些室内学习或工作，提高效率。",
                "拉斐尔提醒您，沉雾期间请保持冷静，确保安全。"
            ],
            "low": [
                "轻度沉雾时，穿着舒适的衣物，保持清爽。",
                "拉斐尔建议您在轻度沉雾天气中进行一些轻松的室内活动。",
                "沉雾天气适合进行一些创意活动，如绘画或写作。",
                "拉斐尔提醒您，沉雾期间请保持警觉，确保安全。"
            ]
        },
        "未知": {
            "high": [
                "拉斐尔无法获取当前的天气信息，请稍后再试。",
                "抱歉，当前天气数据不可用，拉斐尔建议您保持积极的心态。",
                "天气信息暂时缺失，拉斐尔希望您度过愉快的一天。",
                "拉斐尔提醒您，尽管天气信息不可用，但希望您能保持乐观。"
            ],
            "moderate": [
                "拉斐尔无法获取当前的天气信息，请稍后再试。",
                "抱歉，当前天气数据不可用，拉斐尔建议您保持积极的心态。",
                "天气信息暂时缺失，拉斐尔希望您度过愉快的一天。",
                "拉斐尔提醒您，尽管天气信息不可用，但希望您能保持乐观。"
            ],
            "low": [
                "拉斐尔无法获取当前的天气信息，请稍后再试。",
                "抱歉，当前天气数据不可用，拉斐尔建议您保持积极的心态。",
                "天气信息暂时缺失，拉斐尔希望您度过愉快的一天。",
                "拉斐尔提醒您，尽管天气信息不可用，但希望您能保持乐观。"
            ]
        }
    };

        function getTimeSuggestion(hour) {
        const suggestions = timeSuggestions[hour];
        if (suggestions && suggestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * suggestions.length);
            return suggestions[randomIndex];
        }
        return '';
    }

        function getWeatherDescription(code) {
        const weatherCodes = {
            0: "晴",
            1: "晴转多云",
            2: "多云",
            3: "阴",
            45: "雾",
            48: "沉雾",
            51: "细雨",
            53: "中雨",
            55: "小雨",
            56: "冻雨",
            57: "冻毛毛雨",
            61: "小雨",
            63: "中雨",
            65: "大雨",
            66: "冻雨",
            67: "冻大雨",
            71: "小雪",
            73: "中雪",
            75: "大雪",
            77: "雨夹雪",
            80: "阵雨",
            81: "强阵雨",
            82: "暴雨",
            85: "小雪",
            86: "暴雪",
            95: "雷雨",
            96: "雷阵雨&冰雹",
            99: "雷暴&冰雹"
        };
        return weatherCodes[code] || "未知";
    }

        function getWeatherSuggestion(temperature, weatherDescription) {
        let temperatureCategory = '';
        if (temperature >= 30) {
            temperatureCategory = 'high';
        } else if (temperature >= 20 && temperature < 30) {
            temperatureCategory = 'moderate';
        } else {
            temperatureCategory = 'low';
        }

        let weatherType = '未知';
        if (weatherDescription.includes('雪')) {
            weatherType = '雪';
        } else if (weatherDescription.includes('雨')) {
            weatherType = '雨';
        } else if (weatherDescription.includes('雷')) {
            weatherType = '雷';
        } else if (weatherDescription.includes('沉雾')) {
            weatherType = '沉雾';
        } else if (weatherDescription.includes('雾')) {
            weatherType = '雾';
        } else if (weatherDescription.includes('晴')) {
            weatherType = '晴';
        } else if (weatherDescription.includes('多云')) {
            weatherType = '多云';
        } else if (weatherDescription.includes('阴')) {
            weatherType = '阴';
        }

        if (weatherSuggestions[weatherType]) {
            const suggestions = weatherSuggestions[weatherType][temperatureCategory];
            if (suggestions && suggestions.length > 0) {
                const randomIndex = Math.floor(Math.random() * suggestions.length);
                return suggestions[randomIndex];
            }
        }
        return '暂无建议。';
    }

        function updateDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const formattedDate = `${year}年${month}月${day}日`;
        const formattedTime = `${hours}:${minutes}:${seconds}`;
        document.getElementById('current-date').textContent = formattedDate;
        document.getElementById('current-time').textContent = formattedTime;

                const currentHour = now.getHours();
        const timeSuggestion = getTimeSuggestion(currentHour);
        document.getElementById('time-suggestion').textContent = timeSuggestion;
    }

        function fetchWeather(lat, lon) {
        const baseUrl = "https://api.open-meteo.com/v1/forecast";   
        const url = `${baseUrl}?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.current_weather) {
                    const temperature = data.current_weather.temperature;
                    const weatherDescription = getWeatherDescription(data.current_weather.weathercode);
                    document.getElementById('weather').textContent = `${weatherDescription}`;
                    document.getElementById('temperature').textContent = `${temperature}摄氏度`

                                        const weatherSuggestion = getWeatherSuggestion(temperature, weatherDescription);
                    document.getElementById('weather-suggestion').textContent = weatherSuggestion;

                                        const weatherData = {
                        temperature: temperature,
                        weatherDescription: weatherDescription,
                        timestamp: new Date().getTime()
                    };
                    localStorage.setItem('weatherData', JSON.stringify(weatherData));
                } else {
                    document.getElementById('weather').textContent = '天气信息获取失败';
                    document.getElementById('weather-suggestion').textContent = '';
                }
            })
            .catch(() => {
                document.getElementById('weather').textContent = '天气信息获取失败';
                document.getElementById('weather-suggestion').textContent = '';
            });
    }

        function getWeather() {
        const cachedWeather = localStorage.getItem('weatherData');
        const now = new Date().getTime();
        const fifteenMinutes = 15 * 60 * 1000; 
        if (cachedWeather) {
            const weatherData = JSON.parse(cachedWeather);
            const age = now - weatherData.timestamp;

            if (age < fifteenMinutes) {
                                document.getElementById('weather').textContent = `${weatherData.weatherDescription}`;
                document.getElementById('temperature').textContent = `${weatherData.temperature}摄氏度`;

                                const weatherSuggestion = getWeatherSuggestion(weatherData.temperature, weatherData.weatherDescription);
                document.getElementById('weather-suggestion').textContent = weatherSuggestion;
                return;
            }
        }

                if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    fetchWeather(lat, lon);
                },
                () => {
                    document.getElementById('weather').textContent = '无法获取地理位置信息';
                    document.getElementById('weather-suggestion').textContent = '';
                }
            );
        } else {
            document.getElementById('weather').textContent = '浏览器不支持地理定位';
            document.getElementById('weather-suggestion').textContent = '';
        }
    }

        updateDateTime();
    setInterval(updateDateTime, 1000);

        getWeather();

        memoDetailContent.addEventListener('input', () => {
        if (currentSelectedIndex !== null) {
            const newContent = memoDetailContent.textContent.trim();
                        updateMemoContent(currentSelectedIndex, newContent);
                        const memoItems = document.querySelectorAll('.memo-item');
            memoItems.forEach(item => {
                if (item.getAttribute('data-index') == currentSelectedIndex) {
                    const span = item.querySelector('span');
                    span.textContent = newContent || '无内容';
                }
            });
        }
    });
});
