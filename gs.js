const { google } = require("googleapis");
const keys = require("./token.json");

exports.client = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"] // 사용자 시트 및 해당 속성에 대한 읽기/쓰기 액세스 허용
);

exports.gsrun = function (client) {
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
};
