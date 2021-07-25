const { google } = require("googleapis");
const keys = require("./token.json");

const client = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"] // 사용자 시트 및 해당 속성에 대한 읽기/쓰기 액세스 허용
);

async function gsrun(client) {
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
      구분: value[0],
      배달유형: value[1],
      배달시간: value[2],
      업체명: value[3],
      메뉴: value[5],
      양: value[6],
      맛: value[7],
      서비스: value[8],
      리뷰: value[9],
      리뷰어: value[10],
    };

    if (info.구분 && info.업체명) {
      if (categorized[info.구분]) categorized[info.구분].push(info);
      else categorized[info.구분] = [info];
    }
  });
  const actions = [
    getActions("type", categorized, [0, 5]),
    getActions("type", categorized, [5, 10]),
  ];
  console.log(actions);

  return categorized;
}

// async function getActions(callback_id, data, limit = 5) {
//   const len = Object.keys(data).length;
//   const actions = [];
//   const callbackObj = { callback_id, actions: [] };

//   Object.keys(data).forEach((item, index) => {
//     if ((index + 1) % limit === 0) {
//       actions.push({ ...callbackObj });
//       callbackObj.actions = [];
//     } else {
//       callbackObj.actions.push(data[item]);
//     }
//   });

//   if (callbackObj.actions.length) {
//     actions.push(callbackObj);
//   }

//   return actions;
// }
gsrun(client);

function getActions(callback_id, data, range) {
  console.log(Object.keys(data));
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
