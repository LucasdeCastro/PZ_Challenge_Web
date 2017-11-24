const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const router = express.Router();

router.get("/albums", function(req, res) {
  res.setHeader("Content-Type", "text/json");

  const config = {
    method: "GET",
    path: "/pz_challenge/assets.json",
    hostname: "pbmedia.pepblast.com"
  };

  const request = http.request(config, function(response) {
    response.setEncoding("utf8");
    response.on("data", function(data) {
      res.write(data);
    });

    response.on("end", function() {
      res.end();
    });
  });

  request.end();
});

app.use("/api", router);
app.listen(8080);
