const { google } = require("googleapis");
const keys = require("./token.json");

process.env.TZ = "Asia/Seoul";

const client = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"] // 사용자 시트 및 해당 속성에 대한 읽기/쓰기 액세스 허용
);

function gsrun(client) {
  client.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    }
  });

  const sheets = google.sheets({ version: "v4", auth: client });
  const request = {
    spreadsheetId: "1Ke-HsQIgaHIeCBvEYpm0U-UGcn8UBaM5q29hX78dcSM",
    range: "배달음식!A1:F99",
  };
  const response = (await sheets.spreadsheets.values.get(request)).data;
  const responseArray = response.values;

  let categorized = { etc: [] };
  responseArray.forEach(function (value) {
    const category = value[3];
    const restaurant = value[4];

    if (category && restaurant) {
      if (categorized[category]) categorized[category].push(restaurant);
      else categorized[category] = [restaurant];
    }
  });

  return categorized;
}

exports.handler = async (event) => {
  console.log("event body", event.body);
  const path = event.path;

  const buildRespone = (res) => ({
    statusCode: 200,
    body: typeof res === "string" ? res : JSON.stringify(res),
  });

  switch (event.httpMethod) {
    case "GET":
      return buildResponse("Success GET");
    case "POST":
      if (path === "/gowid-slackbot-food-list") {
        return buildRespone({
          attachments: [
            {
              title: "당신의 맛집 선택에 도움을 드립니다!",
              callback_id: "type",
              text: "원하는 종류의 음식을 선택하세요!",
              actions: [
                {
                  name: "action",
                  type: "button",
                  text: "한식",
                  value: "한식",
                },
              ],
            },
          ],
        });
      } else if (path === "/gowid-slackbot-food-list/interactive") {
        const body = JSON.parse(
          decodeURIComponent(event.body).replace("payload=", "")
        );
        if (body.callback_id === "type") {
          const typeVal = body.actions[0].value;
          switch (typeVal) {
            case "한식":
              return buildRespone("t1");
            case "분식":
              return buildRespone("t2");
            case "양식":
              return buildRespone("t3");
            case "중식":
              return buildRespone("t4");
            case "t5":
              return buildRespone("t5");
            case "t6":
              return buildRespone("t6");
            case "아무거나":
              return buildRespone("random");
            default:
              return buildRespone(randomMessage());
          }
        }
      }
  }

  return {
    statusCode: 400,
    body: "unknown httpMethod",
  };
};

function randomMessage() {
  var items = [
    "한솔아~ 이거 만들어볼래?",
    "한솔아~ 내가 많이 만들어놨어~",
    "한솔아~ 재밌겠지?",
    "한솔아.. 한솔아.. 한솔아...!?",
  ];
  return items[Math.floor(Math.random() * items.length)];
}
