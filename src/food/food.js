const { google } = require("googleapis");
const keys = require("../token.json");

const FOOD_SLAKC_URL_DICT = {
  base: "/gowid-slackbot-food-list",
  interactive: "/gowid-slackbot-food-list/interactive",
};

const EMOJI_DICT = {
  νμ: "π₯",
  λμ νΈ: "π¦",
  μ€μ: "π₯‘",
  λΆμ: "π",
  λλ¨μ: "π²",
  μλ¬λ: "π₯",
  μΌμ: "π£",
  μμ: "π",
  λ©μμΉΈ: "π₯",
  κ΅¬λΆ: "π΄",
  λ°°λ¬μ ν: "π΅",
  λ°°λ¬μκ°: "β±",
  μμ²΄λͺ: "π·",
  λ©λ΄: "π",
  μ: "π§",
  λ§: "π­",
  μλΉμ€: "π",
  λ¦¬λ·°: "π",
  λ¦¬λ·°μ΄: "π«",
};

const client = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"] // μ¬μ©μ μνΈ λ° ν΄λΉ μμ±μ λν μ½κΈ°/μ°κΈ° μ‘μΈμ€ νμ©
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
    range: "λ°°λ¬μμ!F8:P99",
  };
  const response = (await sheets.spreadsheets.values.get(request)).data;
  const responseArray = response.values;

  let categorized = {};
  responseArray.forEach(function (value) {
    const info = {
      ...(value[0] && { κ΅¬λΆ: value[0] }),
      ...(value[1] && { λ°°λ¬μ ν: value[1] }),
      ...(value[2] && { λ°°λ¬μκ°: value[2] }),
      ...(value[3] && { μμ²΄λͺ: value[3] }),
      ...(value[5] && { λ©λ΄: value[5] }),
      ...(value[6] && { μ: value[6] }),
      ...(value[7] && { λ§: value[7] }),
      ...(value[8] && { μλΉμ€: value[8] }),
      ...(value[9] && { λ¦¬λ·°: value[9] }),
      ...(value[10] && { λ¦¬λ·°μ΄: value[10] }),
    };

    if (info.κ΅¬λΆ && info.μμ²΄λͺ) {
      if (categorized[info.κ΅¬λΆ]) categorized[info.κ΅¬λΆ].push(info);
      else categorized[info.κ΅¬λΆ] = [info];
    }
  });

  return categorized;
};

function getRandomItem(data, category) {
  var items = data[category];
  return items[Math.floor(Math.random() * items.length)];
}

function getActions({ data, limit = 5, getAction }) {
  const attachments = [];
  const len = Object.keys(data).length;
  for (let i = 0; i < Math.ceil(len / limit); i++) {
    const front = limit * i;
    const rear = limit * (i + 1) > len ? len : limit * (i + 1);
    attachments.push(getAction("type", data, [front, rear]));
  }
  return attachments;
}

function getAction(callback_id, data, range) {
  return {
    callback_id,
    actions: Object.keys(data)
      .map((item, index) => {
        if (index >= range[0] && index < range[1]) {
          return {
            name: "action",
            type: "button",
            text: getText(item),
            value: item,
          };
        }
      })
      .filter((item) => item),
  };
}

function getText(item, isEmojiFirst) {
  const emoji = EMOJI_DICT[item] ? EMOJI_DICT[item] : "π½";
  return isEmojiFirst ? `${emoji} ${item}` : `${item} ${emoji}`;
}

function formattedMessage(item) {
  const plz = "μμ§ μ λ³΄κ° μμ΄μ. λΆνλλ €μ!";
  const titles = [
    "κ΅¬λΆ",
    "μμ²΄λͺ",
    "λ©λ΄",
    "λ°°λ¬μ ν",
    "λ°°λ¬μκ°",
    "λ§",
    "μ",
    "μλΉμ€",
    "λ¦¬λ·°",
    "λ¦¬λ·°μ΄",
  ];
  return titles.map((title) => {
    let text = item[title];

    if (title === "λ°°λ¬μκ°") {
      text = `μ½ ${text}`;
    }

    if (title === "λ¦¬λ·°μ΄") {
      text = `${text} λ`;
    }

    return {
      value: `β’ ${title} : ${item[title] ? text : plz}`,
    };
  });
}

const limit = 5;
const menuAttachments = {
  attachments: [
    {
      title: "κ³ μλ­μ΄ λ°°λ¬ λ§μ§μ μλ €λλ¦½λλ€π",
      callback_id: "type",
      text: "μνλ μ’λ₯μ μμμ μ ννμΈμ!",
    },
    ...getActions({ data, limit, getAction }),
  ],
};

const recommentAttachments = {
  attachments: [
    {
      title: "κ³ μλ­μ μΆμ²μμ βοΈ",
      fields: formattedMessage(getRandomItem(data, typeVal)),
    },
  ],
};

module.exports = {
  client,
  gsrun,
  getRandomItem,
  getActions,
  getAction,
  formattedMessage,
  menuAttachments,
  recommentAttachments,
  FOOD_SLAKC_URL_DICT,
};
