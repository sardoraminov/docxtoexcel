const { Telegraf } = require("telegraf");
const { connect } = require("mongoose");
const User = require("./models/User");
const { default: axios } = require("axios");
const exportUsersToExcel = require("./excelService");
const fs = require("fs");

connect(
  "mongodb+srv://dasturchioka:1234asdf@cluster0.7m8uk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

const bot = new Telegraf("5269373277:AAHFFNdi-vKTG7ICqkyUavWVSEBixxe-dyQ");

bot.start((ctx) =>
  ctx.replyWithHTML(`
<b>Assalomu alaykum, ${ctx.from.first_name}</b>

/send_document - Hujjatlarni yuborish
/clear - Bazani tozalash
`)
);
bot.command("send_document", async (ctx) => {
  ctx.replyWithHTML(`
  Hujjatlarni yuboring.
  
  Yuborib bo'lganingizdan keyin <b>"ok"</b> deb yozing! 
  `);
});

let users = [];
let count = 0;

bot.command("clear", async (ctx) => {
  ctx.reply("Baza tozalanmoqda...");
  try {
    await User.deleteMany();
    fs.unlink("./outputs/users.xlsx", (err) => {
      if (err) console.log(err);
    });
    ctx.reply("Baza tozalandi!");
  } catch (error) {
    console.log(error);
  }
});

bot.on("message", async (ctx) => {
  if (ctx.message.document) {
    users.push(ctx.message.document);
    console.log(users);
  } else if (ctx.message.text === "ok") {
    ctx.replyWithHTML(
      `Jarayon boshlandi! Bu biroz vaqt olishi mumkin. Iltimos, kuting! Jami file lar soni <b>${users.length}</b> ta`
    );

    users.map((user) => {
      const { file_id } = user;
      bot.telegram.getFileLink(file_id).then((url) => {
        axios.get(url.toString()).then((res) => {
          function extractEmails(text) {
            return text.match(
              /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
            );
          }
          function extractNames(text) {
            const changedText = text.replace(/_/gi, " ");
            console.log(changedText);
            return changedText.match(
              /([A-ZА-Я]+[a-zа-я]*(?=\s[A-ZА-Я]+[a-zа-я])(?:\s[A-ZА-Я]+[a-zа-я]*){1,2})/
            );
          }

          const names = extractNames(user.file_name);
          const emails = extractEmails(res.data);

          User.create({
            name: names[0],
            email: emails[0],
          }).then((user) => {
            count++;
            console.log(count);
            console.log(`User created: ${user}`);
            if (count === users.length) {
              ctx.reply(
                `Jarayon tugadi. Excel file generatsiya qilinsinmi? Tasdiqlash uchun "ha" deb yozing!`
              );
            }
          });
        });
      });
    });
  } else if (ctx.message.text === "ha") {
    User.find().then((users) => {
      console.log("excel is writing---------------");
      const workSheetColumnNames = ["Name", "Email"];

      const workSheetName = "Users";

      const filePath = "./outputs/users.xlsx";

      exportUsersToExcel(users, workSheetColumnNames, workSheetName, filePath);

      ctx.replyWithDocument({ source: "./outputs/users.xlsx" });
    });
  } else if (
    !ctx.message.text ||
    ctx.message.text !== "ok" ||
    ctx.message.text !== "ha" ||
    ctx.message.text !== "/clear"
  ) {
    ctx.reply("Faqatgina .doc, .docx kengaytmaga ega file lar qabul qilinadi!");
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
