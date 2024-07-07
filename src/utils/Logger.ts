import tracer from "tracer";
import colors from "colors";
import fs from "fs";
import path from "path";
const logger = tracer.colorConsole({
  format: [
    "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})", //default format
    {
      error:
        "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}", // error format
    },
  ],
  dateformat: "HH:MM:ss.L",
  filters: [colors.yellow, colors.bgBlack],
  preprocess: function (data) {
    data.title = data.title.toUpperCase();
  },
  // transport: function(data) {
  //   fs.appendFile(path.resolve('src/logs/file.log'), data.rawoutput + '\n', err => {
  //     if (err) throw err
  //   })
  // }
});

export default logger;
