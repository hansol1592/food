const {
  client,
  gsrun,
  menuAttachments,
  recommentAttachments,
  FOOD_SLACK_URL_DICT,
} = require("./food");

process.env.TZ = "Asia/Seoul";

exports.handler = async (event) => {
  console.log("event body", event.body);
  const path = event.path;

  const data = await gsrun(client);

  const buildResponse = (res) => ({
    statusCode: 200,
    body: typeof res === "string" ? res : JSON.stringify(res),
  });

  switch (event.httpMethod) {
    case "GET":
      return buildResponse("Success GET");
    case "POST":
      if (path === FOOD_SLACK_URL_DICT.base) {
        return buildResponse(menuAttachments);
      } else if (path === FOOD_SLACK_URL_DICT.interactive) {
        const body = JSON.parse(
          decodeURIComponent(event.body).replace("payload=", "")
        );

        if (body.callback_id === "type") {
          const typeVal = body.actions[0].value;
          if (data[typeVal]) {
            return buildResponse(recommentAttachments);
          }
        }
      }
  }

  return {
    statusCode: 400,
    body: "unknown httpMethod",
  };
};
