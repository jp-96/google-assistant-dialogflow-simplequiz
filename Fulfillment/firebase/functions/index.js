// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

// 実施する問題数
const NUMBER_OF_QUESTIONS = 3;

// 全問正解クイズの答え
const ANSWER = '新美南吉';

// 問題と解説
// 出典：新美南吉のまちづくり（安城市）
// - https://www.city.anjo.aichi.jp/shisei/nankichi/nankichinomachidukuri.html
// - https://www.city.anjo.aichi.jp/shisei/koho/20120401/documents/p08p11.pdf
const data = [
    {
        'もんだい':"昭和13年4月、24歳の時に安城高等女学校に教師として赴任し、英語や国語などを担当した『ごんぎつね』などで知られる童話作家は誰？",
        'かいせつ':"新美南吉は、また、着任時に入学した第19回生の担任として、卒業までの4年間を受け持ちました。",
    },
    {
        'もんだい':"昭和16年10月には初の単行本『良寛物語 手毬と鉢の子』が出版され、幼い頃からの夢であった童話作家となったのは誰？",
        'かいせつ':"昭和14年4月からは現在の安城市新田町で下宿を始め、昭和16年10月には初の単行本『良寛物語 手毬と鉢の子』が、昭和17年10月には初の童話集『おぢいさんのランプ』が出版されました。",
    },
    {
        'もんだい':"ある童話作家は、29歳という若さで亡くなってしまいましたが、その童話作家が安城で過ごした5年間は、教員という社会的地位を得て経済的に安定し、さらに教え子や同僚たちとの交流から精神的にも充実していました。その童話作家とは誰？",
        'かいせつ':"安城時代は、新美南吉が短い生涯の中で最も輝いた青春時代なのです。安城市は、「南吉が青春を過ごしたまち 安城」をキャッチフレーズとし、南吉のまちづくり事業を推進しています。",
    },
    {
        'もんだい':"大正2年7月30日、愛知県知多郡半田町（現半田市）で生まれ、４歳で母を亡くし、８歳で家族と別れて、母方の実家「新美家」の養子に入るなど、複雑な少年時代を送った童話作家は誰？",
        'かいせつ':"複雑な少年時代を送った南吉（本名：正八）は、この頃の孤独や母のぬくもりへの憧れは、後の作品の中に垣間見ることができます。",
    },
    {
        'もんだい':"１８歳の頃から、若手作家の登竜門であり、日本を代表する児童雑誌の『赤い鳥』に作品を投稿するようになった童話作家は誰？",
        'かいせつ':"昭和６年５月号に童謡「窓」が初入選、以後次々に掲載されます。代表作「ごん狐」も、昭和７年１月号に掲載されました。そして、この頃からペンネーム「南吉」が定着していきました。",
    },
    {
        'もんだい':"昭和７年、東京外国語学校英語部文科に入学。東京では、『赤い鳥』を通じて、巽聖歌や与田凖一、江口榛一などとの出会った童話作家は誰？",
        'かいせつ':"東京での巽聖歌や与田凖一、江口榛一などとの交流を通じて、「新美南吉」の名は、児童文学の世界で徐々に認められていきました。",
    },
    {
        'もんだい':"25歳のとき、中学時代の恩師の尽力により、安城高等女学校の教員になることが決まった童話作家は誰？",
        'かいせつ':"順調にみえた東京生活ですが、昭和11年、体調を崩し帰郷することになります。その後、会社勤めをしますが肌にあわず、また、経済的にも苦しかったようです。",
    },
    {
        'もんだい':"安城高等女学校に赴任した翌年、東京外国語学校時代の友人で、新聞記者の江口榛一からの原稿依頼をきっかけに「最後の胡弓弾き」など、次々に作品を執筆した童話作家は誰？",
        'かいせつ':"昭和16年に初の単行本『良寛物語手毬と鉢の子』が、さらにその翌年には、童話集『おぢいさんのランプ』が出版されました。",
    },
    {
        'もんだい':"喉頭結核が原因で、昭和18年3月22日、29歳と７カ月で亡くなった童話作家は誰？",
        'かいせつ':"昭和23年、南吉をしのんだ元同僚や教え子たちによって、安城高等女学校の中庭に南吉の詩が刻まれた「ででむし詩碑」が建てられました。南吉の顕彰碑第１号です。",
    },
    {
        'もんだい':"南吉サルビーは、「ごんぎつね」や「手ぶくろを買いに」など、ある童話作家の代表作品に登場するキツネをイメージしたキャラクターです。その胸には、旧安城高等女学校のある童話作家の教え子たちが建てた「ででむし詩碑」にちなみ、カタツムリのマークがついています。ある童話作家とは誰？",
        'かいせつ':"安城市の「新美南吉のまちづくり」を盛り上げることを目的として、「南吉サルビー」を商品や商品パッケージ等において無償でご利用いただくことが可能です。",
    },
];


// 定型文
const WELCOME_MESSAGE = "南吉の青春クイズへようこそ！";
const HELP_MESSAGE = "すべての問題の答えは、「" + ANSWER + "」です。";
const READY_MESSAGE = "問題をよく聞いてから答えてください。始めてもよろしければ、「はい」とお答えください。";
const START_MESSAGE = "それでは、始めます。";
const NEXT_MESSAGE = "<break strength='strong'/>全問正解クイズ<break strength='strong'/>【問題】<break strength='strong'/>";
const CORRECT_MESSAGE = "正解！<break strength='strong'/>解説します。";
const EXIT_MESSAGE = "また挑戦してくださいね。";
const REPROMPT_MESSAGE = "よく聞き取れませんでした。もう一度、どうぞ。";
const COMPLETE_MESSAGE = "あなたは、素晴らしい！見事、全問正解です。こんなこと初めてです。それでは、また、お会いしましょう。さようなら！";


//=========================================================================================================================================
// helper functions.
//=========================================================================================================================================

function getRandom(min, max)
{
    return Math.floor(Math.random() * (max-min+1)+min);
}

//This is a list of positive speechcons that this skill will use when a user gets a correct answer.  For a full list of supported
//speechcons, go here: https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speechcon-reference
const speechConsCorrect = ["あっはっは", "あら", "あらあ", "イェイ", "うっひゃあ", "うっひょう", "うふふ", "おー", "おおー", "おっ",
"おめでとう", "乾杯", "そうそう", "は〜い", "はっはっは", "万歳", "ピンポーン", "ほ〜", "やったあ",
"やっほう", "ようし", "わ〜い", "わあーっ", "わっしょい"];

//This is a list of negative speechcons that this skill will use when a user gets an incorrect answer.  For a full list of supported
//speechcons, go here: https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speechcon-reference
const speechConsWrong = ["あ〜あ", "あいたた", "あちゃあ", "あっとー", "ありゃ", "あれれ", "うぅ", "ううっ", "え〜", "おっと", "およよ", 
"ぎゃあ", "しくしく", "とほほ", "ドンマイ", "ひいっ", "ぶう", "むっ"];

function getSpeechCon(type)
{
    if (type)
        return "<break strength='strong'/><say-as interpret-as='interjection'>" + speechConsCorrect[getRandom(0, speechConsCorrect.length-1)] + "! </say-as><break strength='strong'/>";
    else
        return "<break strength='strong'/><say-as interpret-as='interjection'>" + speechConsWrong[getRandom(0, speechConsWrong.length-1)] + " </say-as><break strength='strong'/>";
}

//=========================================================================================================================================
// Dialogflow fulfillment
//=========================================================================================================================================

// 開始待ちと回答待ち
const STATES = {
    START:"_START",
    QUIZ:"_QUIZ" 
};

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    let conv = agent.conv();
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
    
    // 初期化
    const init = function() {
        conv.data = {
          state: STATES.START,
          counter: 0,
          index: 0,
        };
        const speechOutput = WELCOME_MESSAGE + HELP_MESSAGE + READY_MESSAGE;
        conv.ask('<speak>' + speechOutput + '</speak>');
        agent.add(conv);
    };
    // クイズの開始
    const startQuestion = function(){
        conv.data.state= STATES.QUIZ;
        conv.data.counter = 0;
        conv.data.index = getRandom(0, data.length-1);
        const response = START_MESSAGE + HELP_MESSAGE;
        nextQuestion(response);
    };
    // 次の問題へ（実施する問題数を終えたなら閉じる）
    const nextQuestion = function(response){
        const mode = conv.data.mode;
        if (NUMBER_OF_QUESTIONS > conv.data.counter) {
            const dataIndex = (conv.data.index + conv.data.counter) % data.length ;
            const dataItem = data[dataIndex];
            const speechOutput = response + NEXT_MESSAGE + dataItem['もんだい'];
            conv.ask('<speak>' + speechOutput + '</speak>');
            agent.add(conv);
        } else {
            const speechOutput = response + getSpeechCon(true) + COMPLETE_MESSAGE;
            conv.close('<speak>' + speechOutput + '</speak>');
            agent.add(conv);
        }
    };
    // 正解
    const correntAnswer = function() {
        const dataIndex = (conv.data.index + conv.data.counter++) % data.length ;
        const dataItem = data[dataIndex];
        const response = CORRECT_MESSAGE + dataItem['かいせつ'];
        nextQuestion(response);
    };
    // 不正解
    const incorrentAnswer = function() {
        const speechOutput = getSpeechCon(false) + HELP_MESSAGE;
        conv.ask('<speak>' + speechOutput + '</speak>');
        agent.add(conv);
    };
    // ヘルプ
    const help = function() {
        const speechOutput = HELP_MESSAGE + READY_MESSAGE;
        conv.ask('<speak>' + speechOutput + '</speak>');
        agent.add(conv);
    };
    // 中断（閉じる）
    const bye = function() {
        const speechOutput = EXIT_MESSAGE;
        conv.close('<speak>' + speechOutput + '</speak>');
        agent.add(conv);
    };
    
    // Run the proper function handler based on the matched Dialogflow intent name
    function welcome(agent) {
        init();
    }
    
    function fallback(agent) {
        if (STATES.START === conv.data.state)
        {
            help();
        }
        else
        {
            incorrentAnswer();
        }
    }
    
    function yes(agent) {
        if (STATES.START === conv.data.state) {
            startQuestion();
        }
        else
        {
            incorrentAnswer();
        }
    }
    
    function answer(agent) {
        if (STATES.QUIZ === conv.data.state) {
            if (ANSWER === agent.parameters.AnswerEntity)
            {
                correntAnswer();
                return;
            }
        }
        incorrentAnswer();
    }
    
    function stop(agent) {
        bye();
    }
    
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('Yes Intent', yes);
    intentMap.set('Answer Intent', answer);
    intentMap.set('Stop Intent', stop);
    agent.handleRequest(intentMap);
});
