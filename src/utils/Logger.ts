import tracer from "tracer";
import colors from "colors";

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
});

export default logger;
