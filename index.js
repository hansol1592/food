const {
  client,
  formattedMessage,
  getAction,
  getActions,
  getRandomItem,
  gsrun,
} = require("./food");

process.env.TZ = "Asia/Seoul";

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
              title: "고슐랭이 배달 맛집을 알려드립니다🏅",
              callback_id: "type",
              text: "원하는 종류의 음식을 선택하세요!",
            },
            ...getActions({ data, limit, getAction }),
          ],
        });
      } else if (path === "/gowid-slackbot-food-list/interactive") {
        const body = JSON.parse(
          decodeURIComponent(event.body).replace("payload=", "")
        );

        if (body.callback_id === "type") {
          const typeVal = body.actions[0].value;
          if (data[typeVal]) {
            return buildResponse({
              attachments: [
                {
                  title: "고슐랭의 추천은요 ✍️",
                  fields: formattedMessage(getRandomItem(data, typeVal)),
                },
              ],
            });
          }
        }
      }
  }

  return {
    statusCode: 400,
    body: "unknown httpMethod",
  };
};
