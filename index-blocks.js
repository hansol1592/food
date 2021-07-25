// const { gsrun, client } = require("./gs.js");
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
    range: "배달음식!A1:F99",
  };
  const response = (await sheets.spreadsheets.values.get(request)).data;
  const responseArray = response.values;

  let categorized = {};
  responseArray.forEach(function (value) {
    const info = {
      category: value[0],
      deliveryType: value[1],
      deliveryTime: value[2],
      restaurant: value[3],
      menu: value[5],
      amout: value[6],
      taste: value[7],
      servie: value[8],
      review: value[9],
      reviewer: value[10],
    };

    if (info.category && info.restaurant && info.category !== "숨기기1") {
      if (categorized[info.category]) categorized[info.category].push(info);
      else categorized[info.category] = [info];
    }
  });

  return categorized;
};

exports.handler = async (event) => {
  console.log("event body", event.body);
  const path = event.path;

  const data = await gsrun(client);

  const elements = Object.keys(data).map((item) => {
    return {
      type: "button",
      text: {
        type: "plain_text",
        emoji: true,
        text: item,
      },
      value: item,
      action_id: "button_action",
    };
  });

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
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "맛집 추천!",
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    emoji: true,
                    text: "한식",
                  },
                  value: "한식",
                  action_id: "button_action",
                },
              ],
            },
          ],
        });
      } else if (path === "/gowid-slackbot-food-list/interactive") {
        let today = new Date();
        const body = JSON.parse(
          decodeURIComponent(event.body).replace("payload=", "")
        );
        if (body.action_id === "button_action") {
          const typeVal = body.actions[0].value;
          switch (typeVal) {
            case "한식":
              return buildResponse(randomMessage(data, "한식"));
            case "분식":
              return buildResponse("t2");
            case "양식":
              return buildResponse("t3");
            case "중식":
              return buildResponse("t4");
            case "t5":
              return buildResponse("t5");
            case "t6":
              return buildResponse("t6");
            case "아무거나":
              return buildResponse("random");
            default:
              return buildResponse(randomMessage());
          }
        }
      }
    default:
      return buildResponse("test");
  }

  return {
    statusCode: 400,
    body: "unknown httpMethod",
  };
};

function randomMessage(data, category) {
  let items = data[category];
  return items[Math.floor(Math.random() * items.length)];
}
