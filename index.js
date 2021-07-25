const { google } = require("googleapis");
const keys = require("./token.json");

process.env.TZ = "Asia/Seoul";

const client = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"] // 사용자 시트 및 해당 속성에 대한 읽기/쓰기 액세스 허용
);

const gsrun = async function (client) {
  client.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    }
  });

  const sheets = google.sheets({ version: "v4", auth: client });
  const request = {
    spreadsheetId: "1Ke-HsQIgaHIeCBvEYpm0U-UGcn8UBaM5q29hX78dcSM",
    range: "배달음식!F8:P99",
  };
  const response = (await sheets.spreadsheets.values.get(request)).data;
  const responseArray = response.values;

  let categorized = {};
  responseArray.forEach(function (value) {
    const info = {
      ...(value[0] && { 구분: value[0] }),
      ...(value[1] && { 배달유형: value[1] }),
      ...(value[2] && { 배달시간: value[2] }),
      ...(value[3] && { 업체명: value[3] }),
      ...(value[5] && { 메뉴: value[5] }),
      ...(value[6] && { 양: value[6] }),
      ...(value[7] && { 맛: value[7] }),
      ...(value[8] && { 서비스: value[8] }),
      ...(value[9] && { 리뷰: value[9] }),
      ...(value[10] && { 리뷰어: value[10] }),
    };

    if (info.구분 && info.업체명) {
      if (categorized[info.구분]) categorized[info.구분].push(info);
      else categorized[info.구분] = [info];
    }
  });

  return categorized;
};

exports.handler = async (event) => {
  console.log("event body", event.body);
  const path = event.path;

  const data = await gsrun(client);
  const limit = 5;

  const buildResponse = (res) => ({
    statusCode: 200,
    body: typeof res === "string" ? res : JSON.stringify(res),
  });

  switch (event.httpMethod) {
    case "GET":
      return buildResponse("Success GET");
    case "POST":
      if (path === "/gowid-slackbot-food-list") {
        return buildResponse({
          attachments: [
            {
              title: "당신의 맛집 선택에 도움을 드립니다!",
              callback_id: "type",
              text: "원하는 종류의 음식을 선택하세요!",
            },
            getAttachment("type", data, [limit * 0, limit * 1]),
            getAttachment("type", data, [limit * 1, limit * 2]),
          ],
        });
      } else if (path === "/gowid-slackbot-food-list/interactive") {
        const body = JSON.parse(
          decodeURIComponent(event.body).replace("payload=", "")
        );

        if (body.callback_id === "type") {
          const typeVal = body.actions[0].value;
          if (data[typeVal]) {
            return buildResponse(
              formattedMessage(getRandomItem(data, typeVal))
            );
          }
        }
      }
  }

  return {
    statusCode: 400,
    body: "unknown httpMethod",
  };
};

function getRandomItem(data, category) {
  var items = data[category];
  return items[Math.floor(Math.random() * items.length)];
}

function getAttachment(callback_id, data, range) {
  return {
    callback_id,
    actions: Object.keys(data)
      .map((item, index) => {
        if (index >= range[0] && index < range[1]) {
          return {
            name: "action",
            type: "button",
            text: item,
            value: item,
          };
        }
      })
      .filter((item) => item),
  };
}

function formattedMessage(item) {
  return `
  *구분* *|* ${
    item.구분 ? item.구분 : "아직 정보가 없어요. 부탁드려요!"
  }\n*배달유형* *|* ${
    item.배달유형 ? item.배달유형 : "아직 정보가 없어요. 부탁드려요!"
  }\n*배달시간* *|* ${
    item.배달시간 ? item.배달시간 : "아직 정보가 없어요. 부탁드려요!"
  }\n*업체명* *|* ${
    item.업체명 ? item.업체명 : "아직 정보가 없어요. 부탁드려요!"
  }\n*메뉴* *|* ${
    item.메뉴 ? item.메뉴 : "아직 정보가 없어요. 부탁드려요!"
  }\n*양* *|* ${
    item.양 ? item.양 : "아직 정보가 없어요. 부탁드려요!"
  }\n*맛* *|* ${
    item.맛 ? item.맛 : "아직 정보가 없어요. 부탁드려요!"
  }\n*서비스* *|* ${
    item.서비스 ? item.서비스 : "아직 정보가 없어요. 부탁드려요!"
  }\n*리뷰* *|* ${
    item.리뷰 ? item.리뷰 : "아직 정보가 없어요. 부탁드려요!"
  }\n*리뷰어* *|* ${
    item.리뷰어 ? item.리뷰어 : "아직 정보가 없어요. 부탁드려요!"
  }
`;
}
