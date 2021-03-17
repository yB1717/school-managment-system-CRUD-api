const express = require("express");
const mongoose = require("mongoose");

const roles = require("./Routes/roles");
const users = require("./Routes/users");
const schools = require("./Routes/schools");
const profiles = require("./Routes/profiles");

const MONGO_URI = require("./config/keys.json").MONGO_URI;
const PORT = process.env.PORT || 4069;

const app = express();

app.use(express.json());

// app.use(isAuth);

app.use("/role", roles);
app.use("/user", users);
app.use("/school", schools);
app.use("/profile", profiles);

mongoose.connect(
  MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    if (err) {
      console.log("Error while connecting to mongoose", err);
    } else {
      console.log("Connection to database established");
      app.listen(PORT, () => {
        console.log(`App listening at ${PORT}`);
      });
    }
  }
);
