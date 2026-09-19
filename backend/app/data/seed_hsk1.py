"""
Seed data containing the 15 HSK 1 characters from the curriculum.
Each character includes phonetics, tone, English translation, radical, stroke count,
mnemonic helper, and practical everyday Chinese examples.
"""

INITIAL_15_CHARACTERS = [
    {
        "hanzi": "不",
        "pinyin": "bù",
        "pinyin_clean": "bu",
        "tone": 4,
        "meaning": "Not; negation",
        "radical": "一",
        "stroke_count": 4,
        "hsk_level": 1,
        "mnemonic": "Visualize a plant with roots trying to grow downward, but a horizontal line says: No!",
        "examples": [
            {"chinese": "不好", "pinyin": "bù hǎo", "meaning": "Not good / Bad"},
            {"chinese": "不用", "pinyin": "bú yòng", "meaning": "No need / You're welcome"},
            {"chinese": "不是", "pinyin": "bú shì", "meaning": "Is not"}
        ]
    },
    {
        "hanzi": "们",
        "pinyin": "men",
        "pinyin_clean": "men",
        "tone": 5,
        "meaning": "Plural suffix for people and pronouns",
        "radical": "亻",
        "stroke_count": 5,
        "hsk_level": 1,
        "mnemonic": "A person (亻) standing in front of a door (门), waiting for the group.",
        "examples": [
            {"chinese": "我们", "pinyin": "wǒmen", "meaning": "We / Us"},
            {"chinese": "你们", "pinyin": "nǐmen", "meaning": "You (plural)"},
            {"chinese": "他们", "pinyin": "tāmen", "meaning": "They / Them"}
        ]
    },
    {
        "hanzi": "你",
        "pinyin": "nǐ",
        "pinyin_clean": "ni",
        "tone": 3,
        "meaning": "You (singular, informal)",
        "radical": "亻",
        "stroke_count": 7,
        "hsk_level": 1,
        "mnemonic": "A person (亻) pointing towards you with warmth.",
        "examples": [
            {"chinese": "你好", "pinyin": "nǐ hǎo", "meaning": "Hello (literally: you good)"},
            {"chinese": "你们好", "pinyin": "nǐmen hǎo", "meaning": "Hello everyone"}
        ]
    },
    {
        "hanzi": "同",
        "pinyin": "tóng",
        "pinyin_clean": "tong",
        "tone": 2,
        "meaning": "Same, together, similar",
        "radical": "口",
        "stroke_count": 6,
        "hsk_level": 1,
        "mnemonic": "People sharing the same tent or space talking with one mouth (口).",
        "examples": [
            {"chinese": "同学", "pinyin": "tóngxué", "meaning": "Classmate"},
            {"chinese": "同意", "pinyin": "tóngyì", "meaning": "To agree"},
            {"chinese": "同屋", "pinyin": "tóngwū", "meaning": "Roommate"}
        ]
    },
    {
        "hanzi": "大",
        "pinyin": "dà",
        "pinyin_clean": "da",
        "tone": 4,
        "meaning": "Big, large, great",
        "radical": "大",
        "stroke_count": 3,
        "hsk_level": 1,
        "mnemonic": "A person stretching out arms and legs as wide as possible to show something big.",
        "examples": [
            {"chinese": "大家", "pinyin": "dàjiā", "meaning": "Everyone"},
            {"chinese": "大学", "pinyin": "dàxué", "meaning": "University"},
            {"chinese": "大人", "pinyin": "dàren", "meaning": "Adult"}
        ]
    },
    {
        "hanzi": "好",
        "pinyin": "hǎo",
        "pinyin_clean": "hao",
        "tone": 3,
        "meaning": "Good, well, fine",
        "radical": "女",
        "stroke_count": 6,
        "hsk_level": 1,
        "mnemonic": "A woman (女) holding her child (子) is a universal symbol of what is good.",
        "examples": [
            {"chinese": "好吃", "pinyin": "hǎochī", "meaning": "Delicious"},
            {"chinese": "好看", "pinyin": "hǎokàn", "meaning": "Good-looking / Beautiful"},
            {"chinese": "好人", "pinyin": "hǎorén", "meaning": "Good person"}
        ]
    },
    {
        "hanzi": "学",
        "pinyin": "xué",
        "pinyin_clean": "xue",
        "tone": 2,
        "meaning": "To study, to learn",
        "radical": "子",
        "stroke_count": 8,
        "hsk_level": 1,
        "mnemonic": "A child (子) under a school roof with knowledge sparks flying overhead.",
        "examples": [
            {"chinese": "学习", "pinyin": "xuéxí", "meaning": "To study / To learn"},
            {"chinese": "学生", "pinyin": "xuésheng", "meaning": "Student"},
            {"chinese": "学校", "pinyin": "xuéxiào", "meaning": "School"}
        ]
    },
    {
        "hanzi": "客",
        "pinyin": "kè",
        "pinyin_clean": "ke",
        "tone": 4,
        "meaning": "Guest, customer, visitor",
        "radical": "宀",
        "stroke_count": 9,
        "hsk_level": 1,
        "mnemonic": "Under the roof (宀), someone arrives (各) as an honored guest.",
        "examples": [
            {"chinese": "客人", "pinyin": "kèrén", "meaning": "Guest / Visitor"},
            {"chinese": "客气", "pinyin": "kèqi", "meaning": "Polite / Courteous"},
            {"chinese": "请客", "pinyin": "qǐngkè", "meaning": "To invite someone / To treat"}
        ]
    },
    {
        "hanzi": "家",
        "pinyin": "jiā",
        "pinyin_clean": "jia",
        "tone": 1,
        "meaning": "Home, family, house",
        "radical": "宀",
        "stroke_count": 10,
        "hsk_level": 1,
        "mnemonic": "A roof (宀) with a domesticated animal/pig (豕) beneath it signifies home in ancient times.",
        "examples": [
            {"chinese": "家人", "pinyin": "jiārén", "meaning": "Family members"},
            {"chinese": "回家", "pinyin": "huíjiā", "meaning": "To return home"},
            {"chinese": "国家", "pinyin": "guójiā", "meaning": "Country / Nation"}
        ]
    },
    {
        "hanzi": "师",
        "pinyin": "shī",
        "pinyin_clean": "shi",
        "tone": 1,
        "meaning": "Teacher, professor (profesor), master",
        "radical": "巾",
        "stroke_count": 6,
        "hsk_level": 1,
        "mnemonic": "A leader carrying the cloth banner (巾) of wisdom leading disciples.",
        "examples": [
            {"chinese": "老师", "pinyin": "lǎoshī", "meaning": "Teacher / Professor"},
            {"chinese": "师傅", "pinyin": "shīfu", "meaning": "Master / Craftsman"},
            {"chinese": "律师", "pinyin": "lǜshī", "meaning": "Lawyer"}
        ]
    },
    {
        "hanzi": "您",
        "pinyin": "nín",
        "pinyin_clean": "nin",
        "tone": 2,
        "meaning": "You (courteous, polite form)",
        "radical": "心",
        "stroke_count": 11,
        "hsk_level": 1,
        "mnemonic": "Addressing 'you' (你) with heartfelt respect (心) directly from the heart.",
        "examples": [
            {"chinese": "您好", "pinyin": "nín hǎo", "meaning": "Hello (respectful)"},
            {"chinese": "您早", "pinyin": "nín zǎo", "meaning": "Good morning (respectful)"}
        ]
    },
    {
        "hanzi": "气",
        "pinyin": "qì",
        "pinyin_clean": "qi",
        "tone": 4,
        "meaning": "Air, breath, gas, energy/qi",
        "radical": "气",
        "stroke_count": 4,
        "hsk_level": 1,
        "mnemonic": "Wisps of vapor, breath, and vital energy flowing in the air.",
        "examples": [
            {"chinese": "天气", "pinyin": "tiānqì", "meaning": "Weather"},
            {"chinese": "生气", "pinyin": "shēngqì", "meaning": "Angry"},
            {"chinese": "运气", "pinyin": "yùnqi", "meaning": "Luck"}
        ]
    },
    {
        "hanzi": "生",
        "pinyin": "shēng",
        "pinyin_clean": "sheng",
        "tone": 1,
        "meaning": "To be born, life, student",
        "radical": "生",
        "stroke_count": 5,
        "hsk_level": 1,
        "mnemonic": "A tender shoot breaking through the soil into life.",
        "examples": [
            {"chinese": "生活", "pinyin": "shēnghuó", "meaning": "Life / To live"},
            {"chinese": "生日", "pinyin": "shēngrì", "meaning": "Birthday"},
            {"chinese": "发生", "pinyin": "fāshēng", "meaning": "To happen / To occur"}
        ]
    },
    {
        "hanzi": "老",
        "pinyin": "lǎo",
        "pinyin_clean": "lao",
        "tone": 3,
        "meaning": "Old, aged, experienced",
        "radical": "老",
        "stroke_count": 6,
        "hsk_level": 1,
        "mnemonic": "An elder with long hair and a cane, representing experience and honor.",
        "examples": [
            {"chinese": "老师", "pinyin": "lǎoshī", "meaning": "Teacher"},
            {"chinese": "老人", "pinyin": "lǎorén", "meaning": "Elderly person"},
            {"chinese": "老朋友", "pinyin": "lǎo péngyou", "meaning": "Old friend"}
        ]
    },
    {
        "hanzi": "见",
        "pinyin": "jiàn",
        "pinyin_clean": "jian",
        "tone": 4,
        "meaning": "To see, to meet",
        "radical": "见",
        "stroke_count": 4,
        "hsk_level": 1,
        "mnemonic": "A person standing on legs with an emphasized eye looking outward.",
        "examples": [
            {"chinese": "再见", "pinyin": "zàijiàn", "meaning": "Goodbye (literally: see again)"},
            {"chinese": "看见", "pinyin": "kànjiàn", "meaning": "To see / To catch sight of"},
            {"chinese": "见面", "pinyin": "jiànmiàn", "meaning": "To meet in person"}
        ]
    }
]
